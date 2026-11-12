import { and, count, eq } from "drizzle-orm";
import { brand } from "@/config/brand";
import { db } from "@/db";
import { users, verificationTokens, workspaceMembers } from "@/db/schema";
import { generateUrlSafeToken, hashToken } from "@/lib/crypto";
import { maxTeamMembers } from "@/lib/entitlements";
import { sendEmail } from "@/lib/email/send";
import type { MemberRole } from "@/lib/permissions";
import { assertPermission, roleMeetsMinimum } from "@/lib/permissions";
import { absoluteUrl } from "@/lib/utils";

const INVITE_EXPIRY_DAYS = 7;

function inviteIdentifier(workspaceId: string, email: string, role: MemberRole) {
  return `team-invite:${workspaceId}:${email.toLowerCase()}:${role}`;
}

export async function listTeamMembers(workspaceId: string) {
  return db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
      userId: workspaceMembers.userId,
      invitedEmail: workspaceMembers.invitedEmail,
      acceptedAt: workspaceMembers.acceptedAt,
      name: users.name,
      email: users.email,
    })
    .from(workspaceMembers)
    .leftJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}

export async function inviteTeamMember(input: {
  workspaceId: string;
  workspaceName: string;
  planId: "free" | "starter" | "pro" | "business";
  inviterUserId: string;
  inviterName: string;
  inviterRole: MemberRole;
  email: string;
  role: MemberRole;
}) {
  assertPermission(input.inviterRole, "members:invite");

  if (input.planId !== "business") {
    throw new Error("Team invitations require the Business plan.");
  }

  if (input.role === "owner") {
    throw new Error("You cannot invite another owner.");
  }

  const limit = maxTeamMembers(input.planId);
  const [memberCount] = await db
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, input.workspaceId));

  if ((memberCount?.count ?? 0) >= limit) {
    throw new Error(`Your plan allows up to ${limit} team members.`);
  }

  const email = input.email.trim().toLowerCase();

  const [existingUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, existingUser.id),
        ),
      )
      .limit(1);

    if (existingMember?.acceptedAt) {
      throw new Error("This person is already a team member.");
    }

    if (!existingMember) {
      await db.insert(workspaceMembers).values({
        workspaceId: input.workspaceId,
        userId: existingUser.id,
        role: input.role,
        invitedEmail: email,
        acceptedAt: null,
      });
    } else {
      await db
        .update(workspaceMembers)
        .set({ role: input.role, invitedEmail: email, updatedAt: new Date() })
        .where(eq(workspaceMembers.id, existingMember.id));
    }
  }

  const rawToken = generateUrlSafeToken(48);
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, inviteIdentifier(input.workspaceId, email, input.role)));

  await db.insert(verificationTokens).values({
    identifier: inviteIdentifier(input.workspaceId, email, input.role),
    token: tokenHash,
    expires,
  });

  const acceptUrl = absoluteUrl(
    `/accept-invite?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}&workspace=${input.workspaceId}`,
  );

  await sendEmail({
    to: email,
    subject: `Invitation to join ${input.workspaceName} on ${brand.productName}`,
    template: "team-invite",
    templateProps: {
      workspaceName: input.workspaceName,
      inviterName: input.inviterName,
      role: input.role,
      acceptUrl,
    },
    workspaceId: input.workspaceId,
    userId: input.inviterUserId,
    relatedType: "team_invite",
  });

  return { email, role: input.role, acceptUrl };
}

export async function acceptTeamInvite(input: {
  userId: string;
  userEmail: string;
  workspaceId: string;
  token: string;
}) {
  const email = input.userEmail.trim().toLowerCase();

  const tokenHash = hashToken(input.token);
  const prefix = `team-invite:${input.workspaceId}:${email}:`;
  const tokens = await db.select().from(verificationTokens);
  const inviteToken = tokens.find(
    (row) =>
      row.identifier.startsWith(prefix) &&
      row.token === tokenHash &&
      row.expires > new Date(),
  );

  if (!inviteToken) {
    throw new Error("Invitation link is invalid or has expired.");
  }

  const role = inviteToken.identifier.split(":").pop() as MemberRole;

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, input.workspaceId),
        eq(workspaceMembers.userId, input.userId),
      ),
    )
    .limit(1);

  if (member) {
    await db
      .update(workspaceMembers)
      .set({ role, acceptedAt: new Date(), invitedEmail: email, updatedAt: new Date() })
      .where(eq(workspaceMembers.id, member.id));
  } else {
    await db.insert(workspaceMembers).values({
      workspaceId: input.workspaceId,
      userId: input.userId,
      role,
      invitedEmail: email,
      acceptedAt: new Date(),
    });
  }

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, inviteToken.identifier));

  return { workspaceId: input.workspaceId, role };
}

export async function updateTeamMemberRole(input: {
  workspaceId: string;
  actorRole: MemberRole;
  memberId: string;
  role: MemberRole;
}) {
  assertPermission(input.actorRole, "members:update");

  if (input.role === "owner") {
    throw new Error("Transfer ownership separately.");
  }

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, input.memberId),
        eq(workspaceMembers.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);

  if (!member) throw new Error("NotFound");
  if (member.role === "owner") {
    throw new Error("The owner role cannot be changed here.");
  }

  if (!roleMeetsMinimum(input.actorRole, "administrator")) {
    throw new Error("Only administrators can change member roles.");
  }

  await db
    .update(workspaceMembers)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(workspaceMembers.id, input.memberId));
}

export async function removeTeamMember(input: {
  workspaceId: string;
  actorRole: MemberRole;
  memberId: string;
}) {
  assertPermission(input.actorRole, "members:remove");

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, input.memberId),
        eq(workspaceMembers.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);

  if (!member) throw new Error("NotFound");
  if (member.role === "owner") {
    throw new Error("The workspace owner cannot be removed.");
  }

  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, input.memberId));
}
