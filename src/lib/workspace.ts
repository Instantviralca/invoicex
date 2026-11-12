import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions, workspaceMembers, workspaces } from "@/db/schema";
import type { BillingSnapshot } from "@/lib/billing/access";
import {
  assertMinimumRole,
  ForbiddenError,
  type MemberRole,
} from "@/lib/permissions";

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    planId: "free" | "starter" | "pro" | "business";
  };
  subscription: BillingSnapshot | null;
};

export class WorkspaceNotFoundError extends Error {
  constructor(message = "Workspace not found.") {
    super(message);
    this.name = "WorkspaceNotFoundError";
  }
}

export class WorkspaceAccessError extends Error {
  constructor(message = "You are not a member of this workspace.") {
    super(message);
    this.name = "WorkspaceAccessError";
  }
}

function mapMemberRole(
  role: "owner" | "administrator" | "staff" | "viewer",
): MemberRole {
  return role;
}

const membershipSelect = {
  id: workspaceMembers.id,
  workspaceId: workspaceMembers.workspaceId,
  userId: workspaceMembers.userId,
  role: workspaceMembers.role,
  workspace: {
    id: workspaces.id,
    name: workspaces.name,
    slug: workspaces.slug,
    ownerId: workspaces.ownerId,
    planId: workspaces.planId,
  },
  subscriptionPlanId: subscriptions.planId,
  subscriptionStatus: subscriptions.status,
  subscriptionInterval: subscriptions.interval,
  subscriptionCancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
  subscriptionCurrentPeriodEnd: subscriptions.currentPeriodEnd,
  subscriptionPendingPlanId: subscriptions.pendingPlanId,
  subscriptionPendingInterval: subscriptions.pendingInterval,
} as const;

function mapMembershipRow(row: {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "administrator" | "staff" | "viewer";
  workspace: WorkspaceMember["workspace"];
  subscriptionPlanId: BillingSnapshot["planId"] | null;
  subscriptionStatus: BillingSnapshot["status"] | null;
  subscriptionInterval: BillingSnapshot["interval"] | null;
  subscriptionCancelAtPeriodEnd: boolean | null;
  subscriptionCurrentPeriodEnd: Date | null;
  subscriptionPendingPlanId: BillingSnapshot["pendingPlanId"];
  subscriptionPendingInterval: BillingSnapshot["pendingInterval"];
}): WorkspaceMember {
  const subscription =
    row.subscriptionPlanId && row.subscriptionStatus && row.subscriptionInterval
      ? {
          planId: row.subscriptionPlanId,
          status: row.subscriptionStatus,
          interval: row.subscriptionInterval,
          cancelAtPeriodEnd: row.subscriptionCancelAtPeriodEnd ?? false,
          currentPeriodEnd: row.subscriptionCurrentPeriodEnd,
          pendingPlanId: row.subscriptionPendingPlanId,
          pendingInterval: row.subscriptionPendingInterval,
        }
      : null;

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: mapMemberRole(row.role),
    workspace: row.workspace,
    subscription,
  };
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember | null> {
  const [membership] = await db
    .select(membershipSelect)
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .leftJoin(subscriptions, eq(subscriptions.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  return mapMembershipRow(membership);
}

export async function getCurrentWorkspace(
  workspaceId?: string | null,
): Promise<WorkspaceMember | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const targetWorkspaceId = workspaceId ?? session.user.workspaceId ?? null;

  if (!targetWorkspaceId) {
    const [firstMembership] = await db
      .select(membershipSelect)
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .leftJoin(subscriptions, eq(subscriptions.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(workspaces.createdAt)
      .limit(1);

    if (!firstMembership) {
      return null;
    }

    return mapMembershipRow(firstMembership);
  }

  return getWorkspaceMembership(userId, targetWorkspaceId);
}

export async function requireWorkspaceMember(
  workspaceId: string,
  minimumRole: MemberRole = "viewer",
): Promise<WorkspaceMember> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new ForbiddenError("You must be signed in to access this workspace.");
  }

  const membership = await getWorkspaceMembership(userId, workspaceId);

  if (!membership) {
    throw new WorkspaceAccessError();
  }

  assertMinimumRole(membership.role, minimumRole);

  return membership;
}

export async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ForbiddenError("You must be signed in to continue.");
  }

  return session.user;
}
