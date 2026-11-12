import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { generateSecureToken, hashToken } from "@/lib/crypto";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_EXPIRY_HOURS = 1;

type ForgotPasswordBody = {
  email?: unknown;
};

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email address, we have sent password reset instructions.";

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = rateLimit("reset", clientId);

  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  let body: ForgotPasswordBody;

  try {
    body = (await request.json()) as ForgotPasswordBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const email = normaliseEmail(body.email);

  if (!email) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000,
      );

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetUrl = absoluteUrl(
        `/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`,
      );

      await sendEmail({
        to: user.email,
        subject: `Reset your ${brand.productName} password`,
        template: "reset-password",
        templateProps: {
          name: user.name,
          resetUrl,
          expiryHours: RESET_EXPIRY_HOURS,
        },
        userId: user.id,
      });

      logger.info({ userId: user.id }, "Password reset email queued");
    } else {
      logger.info({ email }, "Password reset requested for unknown email");
    }

    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    logger.error({ err: error }, "Forgot password request failed");

    return NextResponse.json(
      {
        error:
          "We could not process your request right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
