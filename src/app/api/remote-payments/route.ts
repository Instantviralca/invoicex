import {
  handleRemoteCancel,
  handleRemoteCheckout,
  handleRemoteCreate,
  handleRemoteHealth,
  handleRemoteReturn,
  handleRemoteWebhook,
  parseFormBody,
  RemotePaymentError,
} from "@/lib/mollie/remote-payments";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * WooCommerce Mollie remote-payment server endpoints.
 * Compatible with client query params: wrp_mollie_health, ro, rop, ros, rof, mrp.
 * Also reachable via site-root rewrites (?ro=1 → this route).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    if (url.searchParams.has("rop")) {
      return handleRemoteCheckout(
        url.searchParams.get("rop") ?? "",
        url.searchParams.get("rt") ?? "",
      );
    }
    if (url.searchParams.has("ros")) {
      return handleRemoteReturn(
        url.searchParams.get("ros") ?? "",
        url.searchParams.get("rt") ?? "",
      );
    }
    if (url.searchParams.has("rof")) {
      return handleRemoteCancel(
        url.searchParams.get("rof") ?? "",
        url.searchParams.get("rt") ?? "",
      );
    }
  } catch (error) {
    return remoteErrorResponse(error);
  }

  return new Response("Remote payment endpoint", { status: 200 });
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  try {
    if (url.searchParams.get("wrp_mollie_health") === "1") {
      const form = await parseFormBody(request);
      return handleRemoteHealth(form);
    }

    if (url.searchParams.get("ro") === "1") {
      const form = await parseFormBody(request);
      return handleRemoteCreate(form);
    }

    if (url.searchParams.get("mrp") === "1") {
      const form = await parseFormBody(request);
      return handleRemoteWebhook(form.id ?? "");
    }
  } catch (error) {
    return remoteErrorResponse(error);
  }

  return new Response("Not found", { status: 404 });
}

function remoteErrorResponse(error: unknown): Response {
  if (error instanceof RemotePaymentError) {
    logger.warn(
      { err: error, status: error.status },
      "Remote payment request rejected",
    );
    return new Response(error.message, {
      status: error.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  logger.error({ err: error }, "Remote payment handler failed");
  return new Response("Remote payment server error.", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
