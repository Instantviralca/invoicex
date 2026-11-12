import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { hashToken } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type VerifyEmailBody = {
  email?: unknown;
  token?: unknown;
};

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

async function verifyEmailToken(email: string, token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [storedToken] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, tokenHash),
        gt(verificationTokens.expires, now),
      ),
    )
    .limit(1);

  if (!storedToken) {
    return { success: false as const };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        emailVerified: now,
        updatedAt: now,
      })
      .where(eq(users.email, email));

    await tx
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, tokenHash),
        ),
      );
  });

  return { success: true as const };
}

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = rateLimit("email", clientId);

  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  let body: VerifyEmailBody;

  try {
    body = (await request.json()) as VerifyEmailBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const email = normaliseEmail(body.email);
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!email || !token) {
    return NextResponse.json(
      { error: "Verification link is invalid or has expired." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyEmailToken(email, token);

    if (!result.success) {
      return NextResponse.json(
        { error: "Verification link is invalid or has expired." },
        { status: 400 },
      );
    }

    logger.info({ email }, "Email address verified");

    return NextResponse.json({
      message: "Your email address has been verified. You can now sign in.",
    });
  } catch (error) {
    logger.error({ err: error, email }, "Email verification failed");

    return NextResponse.json(
      {
        error:
          "We could not verify your email address right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = rateLimit("email", clientId);

  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  const { searchParams } = new URL(request.url);
  const email = normaliseEmail(searchParams.get("email"));
  const token = searchParams.get("token")?.trim() ?? "";

  if (!email || !token) {
    return NextResponse.json(
      { error: "Verification link is invalid or has expired." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyEmailToken(email, token);

    if (!result.success) {
      return NextResponse.json(
        { error: "Verification link is invalid or has expired." },
        { status: 400 },
      );
    }

    logger.info({ email }, "Email address verified via GET");

    return NextResponse.json({
      message: "Your email address has been verified. You can now sign in.",
    });
  } catch (error) {
    logger.error({ err: error, email }, "Email verification failed");

    return NextResponse.json(
      {
        error:
          "We could not verify your email address right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
