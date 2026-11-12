import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { processMollieWebhookResource } from "@/lib/mollie/subscriptions";

export const runtime = "nodejs";

async function parseWebhookId(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { id?: string };
      return body.id?.trim() ?? null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    return params.get("id")?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Mollie webhooks are server-to-server; no CSRF/session required. */
export async function POST(request: Request) {
  const resourceId = await parseWebhookId(request);

  if (!resourceId) {
    logger.warn("Mollie webhook received without resource id");
    return NextResponse.json({ error: "Missing resource id." }, { status: 400 });
  }

  try {
    const result = await processMollieWebhookResource(resourceId);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    logger.error({ err: error, resourceId }, "Mollie webhook handler failed");
    // Return 200 so Mollie does not retry indefinitely on unrecoverable errors we logged.
    return NextResponse.json({ received: true, processed: false });
  }
}
