import createMollieClient, {
  type MollieClient,
} from "@mollie/api-client";

let cachedClient: MollieClient | null = null;

/**
 * Server-only Mollie client. Never import this module from client components.
 */
export function getMollieClient(): MollieClient {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.MOLLIE_API_KEY?.trim();

  if (!apiKey || apiKey === "test_replace_me") {
    throw new Error(
      "MOLLIE_API_KEY is not configured. Set a valid test or live key in the environment.",
    );
  }

  cachedClient = createMollieClient({ apiKey });
  return cachedClient;
}

export function getMollieWebhookUrl(): string {
  const configured = process.env.MOLLIE_WEBHOOK_URL?.trim();
  if (configured) {
    return configured;
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/api/billing/webhook`;
}
