import { NextResponse } from "next/server";
import { z } from "zod";
import { brand } from "@/config/brand";
import { db } from "@/db";
import { contactSubmissions } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";
import { hashToken } from "@/lib/crypto";
import {
  getClientIdentifier,
  getRateLimitHeaders,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address."),
  subject: z.string().trim().min(3, "Please enter a subject.").max(200),
  category: z.string().trim().min(1).max(80).default("General"),
  message: z.string().trim().min(10, "Please enter a longer message.").max(5000),
  website: z.string().optional(),
});

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = rateLimit("contact", clientId);

  if (!limit.success) {
    return rateLimitResponse(limit);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { name, email, subject, category, message, website } = parsed.data;

  if (website && website.trim().length > 0) {
    logger.info({ clientId }, "Contact form honeypot triggered");
    return NextResponse.json({
      message: "Thank you for your message. We will respond shortly.",
    });
  }

  try {
    await db.insert(contactSubmissions).values({
      name,
      email,
      subject,
      category,
      message,
      ipHash: hashToken(clientId),
      honeypot: website ?? null,
    });

    await sendEmail({
      to: brand.supportEmail,
      subject: `[Contact] ${subject}`,
      template: "contact-internal-notification",
      templateProps: { name, email, subject, category, message },
    });

    await sendEmail({
      to: email,
      subject: "We received your message",
      template: "contact-confirmation",
      templateProps: { name, subject },
    });

    logger.info({ email, subject }, "Contact form submitted");

    return NextResponse.json(
      { message: "Thank you for your message. We will respond shortly." },
      { headers: getRateLimitHeaders(limit) },
    );
  } catch (error) {
    logger.error({ err: error }, "Contact form submission failed");

    return NextResponse.json(
      {
        error:
          "We could not send your message right now. Please try again shortly or email us directly.",
      },
      { status: 500 },
    );
  }
}

