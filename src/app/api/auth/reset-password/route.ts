import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import { hashToken } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResetPasswordBody = {
  email?: unknown;
  token?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = rateLimit("reset", clientId);

  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  let body: ResetPasswordBody;

  try {
    body = (await request.json()) as ResetPasswordBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const email = normaliseEmail(body.email);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!email || !token) {
    return NextResponse.json(
      { error: "Reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 },
    );
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { error: passwordValidation.errors[0] },
      { status: 400 },
    );
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  try {
    const [resetRecord] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          eq(users.email, email),
          gt(passwordResetTokens.expiresAt, now),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
        })
        .where(eq(users.id, resetRecord.userId));

      await tx
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      await tx
        .delete(sessions)
        .where(eq(sessions.userId, resetRecord.userId));
    });

    logger.info({ userId: resetRecord.userId }, "Password reset completed");

    return NextResponse.json({
      message:
        "Your password has been updated. Please sign in with your new password.",
    });
  } catch (error) {
    logger.error({ err: error }, "Password reset failed");

    return NextResponse.json(
      {
        error:
          "We could not reset your password right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
