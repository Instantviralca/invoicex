import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminSessions, adminUsers, auditLogs } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

const ADMIN_COOKIE = "ir_admin_session";
const SESSION_DAYS = 7;

export function hashAdminToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateAdmin(email: string, password: string) {
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase().trim()))
    .limit(1);

  if (!admin) return null;
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return null;
  return admin;
}

export async function createAdminSession(adminUserId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashAdminToken(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(adminSessions).values({
    adminUserId,
    sessionToken: tokenHash,
    expires,
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return { expires };
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.sessionToken, hashAdminToken(token)));
  }
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashAdminToken(token);
  const [row] = await db
    .select({
      sessionId: adminSessions.id,
      expires: adminSessions.expires,
      adminId: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.sessionToken, tokenHash),
        gt(adminSessions.expires, new Date()),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }
  return session;
}

export async function logAdminAction(input: {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorAdminId: input.adminId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
}

export async function ensureBootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase()))
    .limit(1);

  if (existing) return;

  const passwordHash = await hashPassword(password);
  await db.insert(adminUsers).values({
    email: email.toLowerCase(),
    name: "Platform Admin",
    passwordHash,
    role: "superadmin",
  });
}
