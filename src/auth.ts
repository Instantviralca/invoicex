import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { brand } from "@/config/brand";
import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { logger } from "@/lib/logger";
import type { MemberRole } from "@/lib/permissions";
import { verifyPassword } from "@/lib/password";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function resolvePrimaryWorkspace(userId: string) {
  const membership = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(workspaces.createdAt)
    .limit(1);

  return membership[0] ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    // Schema uses UUID id + sessionToken unique; adapter types expect token PK.
    sessionsTable: sessions as never,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash) {
          return null;
        }

        if (user.suspendedAt) {
          logger.warn({ userId: user.id }, "Suspended account login attempt");
          throw new Error("AccountSuspended");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          logger.warn({ userId: user.id }, "Locked account login attempt");
          throw new Error("AccountLocked");
        }

        const passwordValid = await verifyPassword(password, user.passwordHash);

        if (!passwordValid) {
          const failedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;

          await db
            .update(users)
            .set({
              failedLoginAttempts: failedAttempts,
              lockedUntil: shouldLock
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        await db
          .update(users)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        const workspace = await resolvePrimaryWorkspace(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          workspaceId: workspace?.workspaceId ?? null,
          workspaceRole: (workspace?.role as MemberRole | undefined) ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email!;
        token.name = user.name!;
        token.picture = user.image ?? null;
        token.emailVerified = user.emailVerified ?? null;
        token.workspaceId = user.workspaceId ?? null;
        token.workspaceRole = user.workspaceRole ?? null;
      }

      if (trigger === "update" && session?.user) {
        if (session.user.workspaceId !== undefined) {
          token.workspaceId = session.user.workspaceId;
        }
        if (session.user.workspaceRole !== undefined) {
          token.workspaceRole = session.user.workspaceRole;
        }
        if (session.user.name !== undefined) {
          token.name = session.user.name;
        }
        if (session.user.image !== undefined) {
          token.picture = session.user.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.email = String(token.email ?? session.user.email);
        session.user.name = String(token.name ?? session.user.name);
        session.user.image = (token.picture as string | null | undefined) ?? null;
        session.user.emailVerified =
          (token.emailVerified as Date | null | undefined) ?? null;
        session.user.workspaceId =
          (token.workspaceId as string | null | undefined) ?? null;
        session.user.workspaceRole =
          (token.workspaceRole as MemberRole | null | undefined) ?? null;
      }

      return session;
    },
    async signIn({ user }) {
      if (!user?.id) {
        return false;
      }

      return true;
    },
  },
  events: {
    async signIn({ user }) {
      logger.info({ userId: user.id }, "User signed in");
    },
    async signOut(message) {
      const userId = "token" in message ? message.token?.id : undefined;
      logger.info({ userId }, "User signed out");
    },
  },
  logger: {
    error(error) {
      logger.error({ err: error }, "Auth.js error");
    },
    warn(code) {
      logger.warn({ code }, "Auth.js warning");
    },
    debug(message) {
      if (process.env.NODE_ENV !== "production") {
        logger.debug({ message }, "Auth.js debug");
      }
    },
  },
  secret: process.env.AUTH_SECRET,
});

export const authBrandName = brand.productName;
