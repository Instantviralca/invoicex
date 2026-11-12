import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { db } from "@/db";
import {
  businessProfiles,
  subscriptions,
  users,
  verificationTokens,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { generateUrlSafeToken, hashToken } from "@/lib/crypto";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_EXPIRY_HOURS = 24;

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  acceptTerms?: unknown;
  marketingConsent?: unknown;
};

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function createWorkspaceSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "workspace";

  return `${base}-${generateUrlSafeToken(6).toLowerCase()}`;
}

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = rateLimit("register", clientId);

  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  let body: RegisterBody;

  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = normaliseEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  const acceptTerms = body.acceptTerms === true;
  const marketingConsent = body.marketingConsent === true;

  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Please enter your full name." },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!acceptTerms) {
    return NextResponse.json(
      { error: "You must accept the terms to create an account." },
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

  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      logger.info({ email }, "Registration attempted for existing email");
      return NextResponse.json(
        {
          message:
            "If this email address is not already registered, we have sent a verification link.",
        },
        { status: 201 },
      );
    }

    const passwordHash = await hashPassword(password);
    const workspaceName = `${name.split(" ")[0]}'s workspace`;
    const workspaceSlug = createWorkspaceSlug(name);

    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          marketingConsent,
        })
        .returning({ id: users.id, email: users.email, name: users.name });

      if (!user) {
        throw new Error("Failed to create user");
      }

      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: workspaceName,
          slug: workspaceSlug,
          ownerId: user.id,
          planId: "free",
        })
        .returning({ id: workspaces.id });

      if (!workspace) {
        throw new Error("Failed to create workspace");
      }

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
        acceptedAt: new Date(),
      });

      await tx.insert(subscriptions).values({
        workspaceId: workspace.id,
        planId: "free",
        interval: "month",
        status: "active",
      });

      await tx.insert(businessProfiles).values({
        workspaceId: workspace.id,
        tradingName: name,
        email: user.email,
        isDefault: true,
      });

      const verificationToken = generateUrlSafeToken(48);
      const tokenHash = hashToken(verificationToken);
      const expires = new Date(
        Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
      );

      await tx.insert(verificationTokens).values({
        identifier: email,
        token: tokenHash,
        expires,
      });

      return { user, workspace, verificationToken };
    });

    const verifyUrl = absoluteUrl(
      `/verify-email?token=${encodeURIComponent(result.verificationToken)}&email=${encodeURIComponent(email)}`,
    );

    await sendEmail({
      to: email,
      subject: `Verify your ${brand.productName} account`,
      template: "verify-email",
      templateProps: {
        name,
        verifyUrl,
        expiryHours: VERIFICATION_EXPIRY_HOURS,
      },
      userId: result.user.id,
      workspaceId: result.workspace.id,
    });

    logger.info(
      { userId: result.user.id, workspaceId: result.workspace.id },
      "User registered",
    );

    return NextResponse.json(
      {
        message:
          "If this email address is not already registered, we have sent a verification link.",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ err: error }, "Registration failed");

    return NextResponse.json(
      {
        error:
          "We could not create your account right now. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}
