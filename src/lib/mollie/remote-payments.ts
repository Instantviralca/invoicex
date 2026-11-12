import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { remoteOrders, remotePaymentNonces } from "@/db/schema";
import {
  resolveRemotePaymentCurrency,
  serverCurrencyHealthLabel,
} from "@/lib/mollie/remote-currency";
import { ensureRemotePaymentSchema } from "@/lib/mollie/ensure-remote-payment-schema";

export class RemotePaymentError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RemotePaymentError";
    this.status = status;
  }
}

type MollieAmount = { currency: string; value: string };
type MolliePayment = {
  id: string;
  status: string;
  method?: string | null;
  amount: MollieAmount;
  metadata?: Record<string, string> | null;
  _links?: { checkout?: { href?: string } };
};

type ClientRequestData = {
  order_id: string;
  request_ts: string;
  request_nonce: string;
  callback_url: string;
  return_url: string;
  cancel_url: string;
  amount: string;
  currency: string;
  product_name: string;
  merchant_order_number: string;
  items_json: string;
  integration_mode: string;
  card_token: string;
  signature: string;
};

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function getRemoteApiKey(): string {
  return process.env.MOLLIE_REMOTE_API_KEY?.trim() ?? "";
}

function getSharedSecret(): string {
  return process.env.MOLLIE_REMOTE_SHARED_SECRET?.trim() ?? "";
}

function getConfiguredServerCurrency(): string {
  return process.env.MOLLIE_REMOTE_CURRENCY?.trim() ?? "";
}

function getDescriptionFormat(): string {
  const configured = process.env.MOLLIE_REMOTE_DESCRIPTION_FORMAT?.trim();
  return configured || "Order #{order_number}";
}

function getDefaultDescription(): string {
  const configured = process.env.MOLLIE_REMOTE_DEFAULT_DESCRIPTION?.trim();
  return configured || "Online Order";
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function normalizeMerchantOrderNumber(value: string): string | false {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[1-9][0-9]{0,11}$/.test(trimmed) ? trimmed : false;
}

function isValidHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function formatAmount(value: string | number): string {
  return Number(value).toFixed(2);
}

function sanitizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function buildDescription(description: string, orderNumber: string): string {
  let product = description.trim().slice(0, 120);
  if (!product) product = getDefaultDescription();

  let format = getDescriptionFormat().slice(0, 180);
  format = format.replace(/\{(?!description\}|order_number\})[^}]+\}/g, "");

  const built = format
    .replaceAll("{description}", product)
    .replaceAll("{order_number}", orderNumber)
    .trim();

  return (built || product).slice(0, 255);
}

function requestSignaturePayload(data: ClientRequestData): string {
  const parts = [
    String(data.order_id),
    String(data.request_ts),
    String(data.request_nonce),
    String(data.callback_url),
    String(data.return_url),
    String(data.cancel_url),
    String(data.amount),
    String(data.currency),
  ];

  if (data.product_name) {
    parts.push(String(data.product_name));
  }
  if (data.merchant_order_number) {
    parts.push(String(data.merchant_order_number));
  }

  parts.push(createHash("sha256").update(String(data.items_json)).digest("hex"));

  if (data.integration_mode === "components_v1") {
    parts.push("components_v1");
    parts.push(createHash("sha256").update(String(data.card_token)).digest("hex"));
  }

  return parts.join("|");
}

async function mollieRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const apiKey = getRemoteApiKey();
  if (!apiKey || !/^(test|live)_[A-Za-z0-9]+$/.test(apiKey)) {
    throw new RemotePaymentError(
      "A valid Mollie API key is not configured.",
      503,
    );
  }

  const response = await fetch(
    `https://api.mollie.com/v2/${path.replace(/^\//, "")}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/hal+json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    },
  );

  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail =
      typeof data.detail === "string" ? data.detail : "Mollie API request failed.";
    throw new RemotePaymentError(detail, 502);
  }

  return data as T;
}

async function consumeNonce(nonce: string): Promise<void> {
  const cleaned = sanitizeKey(nonce);
  if (!cleaned) {
    throw new RemotePaymentError("Remote payment request was already used.", 403);
  }

  const nonceHash = createHash("sha256").update(cleaned).digest("hex");
  const now = new Date();

  await db
    .delete(remotePaymentNonces)
    .where(lt(remotePaymentNonces.expiresAt, now));

  const existingRows = await db
    .select()
    .from(remotePaymentNonces)
    .where(
      and(
        eq(remotePaymentNonces.nonceHash, nonceHash),
        gt(remotePaymentNonces.expiresAt, now),
      ),
    )
    .limit(1);

  if (existingRows[0]) {
    throw new RemotePaymentError("Remote payment request was already used.", 403);
  }

  await db.insert(remotePaymentNonces).values({
    nonceHash,
    expiresAt: new Date(Date.now() + 20 * 60 * 1000),
  });
}

async function verifyClientRequest(data: ClientRequestData): Promise<void> {
  const secret = getSharedSecret();
  if (secret.length < 16) {
    throw new RemotePaymentError(
      "Remote payment Shared Secret is not configured on the server.",
      503,
    );
  }

  const required: (keyof ClientRequestData)[] = [
    "order_id",
    "request_ts",
    "request_nonce",
    "callback_url",
    "return_url",
    "cancel_url",
    "amount",
    "currency",
    "items_json",
    "signature",
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new RemotePaymentError("Missing required remote payment data.", 403);
    }
  }

  const timestamp = Number.parseInt(data.request_ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (
    !Number.isFinite(timestamp) ||
    timestamp < now - 900 ||
    timestamp > now + 300
  ) {
    throw new RemotePaymentError("Remote payment request has expired.", 403);
  }

  const merchantOrderNumber = normalizeMerchantOrderNumber(
    data.merchant_order_number ?? "",
  );
  if (merchantOrderNumber === false) {
    throw new RemotePaymentError("Invalid merchant_order_number.", 403);
  }

  const integrationMode = sanitizeKey(data.integration_mode ?? "");
  if (integrationMode && integrationMode !== "components_v1") {
    throw new RemotePaymentError("Invalid remote payment integration mode.", 403);
  }

  if (integrationMode === "components_v1") {
    const cardToken = data.card_token.trim();
    if (!cardToken || !/^tkn_[A-Za-z0-9]+$/.test(cardToken)) {
      throw new RemotePaymentError("Invalid Mollie card token.", 403);
    }
  } else if (data.card_token) {
    throw new RemotePaymentError(
      "Card token is not valid for hosted checkout mode.",
      403,
    );
  }

  const expected = createHmac("sha256", secret)
    .update(requestSignaturePayload(data))
    .digest("hex");

  if (!safeEqual(expected, data.signature)) {
    throw new RemotePaymentError("Invalid remote payment signature.", 403);
  }

  await consumeNonce(data.request_nonce);
}

function paymentMatchesOrder(
  payment: MolliePayment,
  order: typeof remoteOrders.$inferSelect,
): boolean {
  const expectedAmount = formatAmount(order.amount);
  const actualAmount = payment.amount?.value
    ? formatAmount(payment.amount.value)
    : "";
  const expectedCurrency = order.currency.toUpperCase();
  const actualCurrency = (payment.amount?.currency ?? "").toUpperCase();

  return (
    expectedAmount === actualAmount &&
    expectedCurrency === actualCurrency &&
    Boolean(order.molliePaymentId) &&
    Boolean(payment.id) &&
    safeEqual(order.molliePaymentId ?? "", payment.id)
  );
}

async function updateOrderFromPayment(
  orderId: string,
  payment: MolliePayment,
): Promise<void> {
  await db
    .update(remoteOrders)
    .set({
      paymentStatus: payment.status || "unknown",
      paymentMethod:
        typeof payment.method === "string" ? payment.method : null,
      updatedAt: new Date(),
    })
    .where(eq(remoteOrders.id, orderId));
}

async function notifyClientPaid(
  order: typeof remoteOrders.$inferSelect,
  payment: MolliePayment,
): Promise<boolean> {
  if (order.callbackSentAt) {
    return true;
  }

  if (payment.status !== "paid" || !paymentMatchesOrder(payment, order)) {
    return false;
  }

  const callbackUrl = isValidHttpUrl(order.callbackUrl);
  if (!callbackUrl) {
    return false;
  }

  const secret = getSharedSecret();
  const price = formatAmount(payment.amount.value);
  const currency = payment.amount.currency.toUpperCase();
  const callbackTs = Math.floor(Date.now() / 1000);
  const signaturePayload = [
    order.clientOrderId,
    payment.id,
    price,
    currency,
    String(callbackTs),
  ].join("|");

  const body = new URLSearchParams({
    order_id: order.clientOrderId,
    txn_id: payment.id,
    mollie_payment_id: payment.id,
    price,
    currency_code: currency,
    product_name: order.productName,
    payment_status: "paid",
    callback_ts: String(callbackTs),
    signature: createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex"),
  });

  const response = await fetch(callbackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });

  if (response.status >= 200 && response.status < 300) {
    await db
      .update(remoteOrders)
      .set({ callbackSentAt: new Date(), updatedAt: new Date() })
      .where(eq(remoteOrders.id, order.id));
    return true;
  }

  return false;
}

async function createPaymentForOrder(
  order: typeof remoteOrders.$inferSelect,
  cardToken = "",
): Promise<{ payment: MolliePayment; checkoutUrl: string }> {
  const merchantOrderNumber =
    normalizeMerchantOrderNumber(order.merchantOrderNumber ?? "") || "";
  const displayOrderNumber = merchantOrderNumber || order.clientOrderId;

  const metadata: Record<string, string> = {
    remote_order_id: order.id,
    client_order_id: order.clientOrderId,
  };
  if (merchantOrderNumber) {
    metadata.merchant_order_number = merchantOrderNumber;
  }

  const paymentBody: Record<string, unknown> = {
    amount: {
      currency: order.currency,
      value: formatAmount(order.amount),
    },
    description: buildDescription(order.productName, displayOrderNumber),
    redirectUrl: `${getAppBaseUrl()}/?ros=${order.id}&rt=${order.accessToken}`,
    cancelUrl: `${getAppBaseUrl()}/?rof=${order.id}&rt=${order.accessToken}`,
    webhookUrl: `${getAppBaseUrl()}/?mrp=1`,
    metadata,
  };

  if (cardToken) {
    if (!/^tkn_[A-Za-z0-9]+$/.test(cardToken)) {
      throw new RemotePaymentError("Invalid Mollie card token.", 400);
    }
    paymentBody.method = "creditcard";
    paymentBody.cardToken = cardToken;
  }

  const payment = await mollieRequest<MolliePayment>(
    "POST",
    "payments",
    paymentBody,
  );
  const checkoutUrl = payment._links?.checkout?.href?.trim() ?? "";
  if (!payment.id || !checkoutUrl) {
    throw new RemotePaymentError("Mollie did not return a checkout URL.", 502);
  }

  await db
    .update(remoteOrders)
    .set({
      molliePaymentId: payment.id,
      mollieCheckoutUrl: checkoutUrl,
      paymentStatus: payment.status || "open",
      paymentMethod:
        typeof payment.method === "string" ? payment.method : null,
      updatedAt: new Date(),
    })
    .where(eq(remoteOrders.id, order.id));

  return { payment, checkoutUrl };
}

export async function handleRemoteHealth(
  form: Record<string, string>,
): Promise<Response> {
  await ensureRemotePaymentSchema();

  const timestamp = Number.parseInt(form.request_ts ?? "0", 10);
  const signature = form.signature ?? "";
  const secret = getSharedSecret();
  const now = Math.floor(Date.now() / 1000);

  if (
    secret.length < 16 ||
    !Number.isFinite(timestamp) ||
    timestamp < now - 300 ||
    timestamp > now + 300
  ) {
    return Response.json(
      { ok: false, message: "Shared Secret or server time is invalid." },
      { status: 403 },
    );
  }

  const expected = createHmac("sha256", secret)
    .update(`health|${timestamp}`)
    .digest("hex");
  if (!signature || !safeEqual(expected, signature)) {
    return Response.json(
      { ok: false, message: "Shared Secret does not match." },
      { status: 403 },
    );
  }

  const apiKey = getRemoteApiKey();
  if (!apiKey || !/^(test|live)_[A-Za-z0-9]+$/.test(apiKey)) {
    return Response.json(
      { ok: false, message: "A valid Mollie API key is not configured." },
      { status: 503 },
    );
  }

  try {
    const profile = await mollieRequest<{ id?: string }>("GET", "profiles/me");
    if (!profile.id || !profile.id.startsWith("pfl_")) {
      return Response.json(
        {
          ok: false,
          message: "Could not load the Mollie profile for this API key.",
        },
        { status: 503 },
      );
    }

    const filterLabel = serverCurrencyHealthLabel(getConfiguredServerCurrency());
    return Response.json({
      ok: true,
      currency: filterLabel,
      profile_id: profile.id,
      testmode: apiKey.startsWith("test_"),
      hosted_checkout: true,
    });
  } catch (error) {
    const message =
      error instanceof RemotePaymentError
        ? error.message
        : "Could not load the Mollie profile for this API key.";
    return Response.json({ ok: false, message }, { status: 503 });
  }
}

export async function handleRemoteCreate(
  form: Record<string, string>,
): Promise<Response> {
  await ensureRemotePaymentSchema();

  const data: ClientRequestData = {
    order_id: form.order_id ?? "",
    request_ts: form.request_ts ?? "",
    request_nonce: form.request_nonce ?? "",
    callback_url: form.callback_url ?? "",
    return_url: form.return_url ?? "",
    cancel_url: form.cancel_url ?? "",
    amount: form.amount ?? "",
    currency: form.currency ?? "",
    product_name: form.product_name ?? "",
    merchant_order_number: form.merchant_order_number ?? "",
    items_json: form.items_json ?? "",
    integration_mode: form.integration_mode ?? "",
    card_token: form.card_token ?? "",
    signature: form.signature ?? "",
  };

  await verifyClientRequest(data);

  const apiKey = getRemoteApiKey();
  if (!apiKey || !/^(test|live)_[A-Za-z0-9]+$/.test(apiKey)) {
    throw new RemotePaymentError(
      "A valid Mollie API key is not configured on the payment server.",
      503,
    );
  }

  const callbackUrl = isValidHttpUrl(data.callback_url);
  const returnUrl = isValidHttpUrl(data.return_url);
  const cancelUrl = isValidHttpUrl(data.cancel_url);
  const amount = formatAmount(data.amount);
  let productName = data.product_name.trim().slice(0, 64);
  if (!productName) productName = getDefaultDescription().slice(0, 64);

  const merchantOrderNumber = normalizeMerchantOrderNumber(
    data.merchant_order_number,
  );
  if (merchantOrderNumber === false) {
    throw new RemotePaymentError("Invalid merchant_order_number.", 400);
  }

  const integrationMode = sanitizeKey(data.integration_mode);
  const currencyResolution = resolveRemotePaymentCurrency(
    getConfiguredServerCurrency(),
    data.currency,
  );
  let items: unknown;
  try {
    items = JSON.parse(data.items_json);
  } catch {
    items = null;
  }

  if (
    !callbackUrl ||
    !returnUrl ||
    !cancelUrl ||
    Number(amount) <= 0 ||
    !Array.isArray(items)
  ) {
    throw new RemotePaymentError("Invalid remote payment data.", 400);
  }

  if (!currencyResolution.ok) {
    if (currencyResolution.reason === "currency_mismatch") {
      throw new RemotePaymentError("Invalid remote payment currency.", 400);
    }
    throw new RemotePaymentError("Invalid remote payment data.", 400);
  }

  // Always the validated client currency — never the literal "ANY".
  const currency = currencyResolution.clientCurrency;

  const orderId = Number.parseInt(data.order_id, 10);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new RemotePaymentError("Invalid order ID.", 400);
  }

  const accessToken = randomBytes(24).toString("hex");
  const [order] = await db
    .insert(remoteOrders)
    .values({
      clientOrderId: String(orderId),
      accessToken,
      callbackUrl,
      returnUrl,
      cancelUrl,
      amount,
      currency,
      productName,
      merchantOrderNumber: merchantOrderNumber || null,
      integrationMode,
      items,
    })
    .returning();

  if (!order) {
    throw new RemotePaymentError("Could not create remote order.", 500);
  }

  if (integrationMode === "components_v1") {
    const paymentResult = await createPaymentForOrder(order, data.card_token);
    return new Response(paymentResult.checkoutUrl, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const payUrl = `${getAppBaseUrl()}/?rop=${order.id}&rt=${accessToken}`;
  return new Response(payUrl, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function handleRemoteCheckout(
  remoteOrderId: string,
  accessToken: string,
): Promise<Response> {
  await ensureRemotePaymentSchema();

  const orderRows = await db
    .select()
    .from(remoteOrders)
    .where(eq(remoteOrders.id, remoteOrderId))
    .limit(1);
  const order = orderRows[0];

  if (!order || !safeEqual(order.accessToken, accessToken)) {
    return new Response(null, { status: 404 });
  }

  if (order.molliePaymentId) {
    try {
      const existing = await mollieRequest<MolliePayment>(
        "GET",
        `payments/${encodeURIComponent(order.molliePaymentId)}`,
      );
      await updateOrderFromPayment(order.id, existing);

      if (
        (existing.status === "open" || existing.status === "pending") &&
        order.mollieCheckoutUrl
      ) {
        return Response.redirect(order.mollieCheckoutUrl, 303);
      }

      if (existing.status === "paid") {
        await notifyClientPaid(order, existing);
        return Response.redirect(order.returnUrl, 303);
      }
    } catch {
      // Fall through and create a fresh payment.
    }
  }

  const paymentResult = await createPaymentForOrder(order);
  return Response.redirect(paymentResult.checkoutUrl, 303);
}

export async function handleRemoteReturn(
  remoteOrderId: string,
  accessToken: string,
): Promise<Response> {
  await ensureRemotePaymentSchema();

  const orderRows = await db
    .select()
    .from(remoteOrders)
    .where(eq(remoteOrders.id, remoteOrderId))
    .limit(1);
  const order = orderRows[0];

  if (!order || !safeEqual(order.accessToken, accessToken)) {
    return new Response(null, { status: 404 });
  }

  if (order.molliePaymentId) {
    try {
      const payment = await mollieRequest<MolliePayment>(
        "GET",
        `payments/${encodeURIComponent(order.molliePaymentId)}`,
      );
      await updateOrderFromPayment(order.id, payment);
      if (payment.status === "paid") {
        await notifyClientPaid(order, payment);
      }
    } catch {
      // Still send the shopper back to the client return URL.
    }
  }

  return Response.redirect(order.returnUrl, 303);
}

export async function handleRemoteCancel(
  remoteOrderId: string,
  accessToken: string,
): Promise<Response> {
  await ensureRemotePaymentSchema();

  const orderRows = await db
    .select()
    .from(remoteOrders)
    .where(eq(remoteOrders.id, remoteOrderId))
    .limit(1);
  const order = orderRows[0];

  if (!order || !safeEqual(order.accessToken, accessToken)) {
    return new Response(null, { status: 404 });
  }

  return Response.redirect(order.cancelUrl, 303);
}

export async function handleRemoteWebhook(
  paymentId: string,
): Promise<Response> {
  await ensureRemotePaymentSchema();

  if (!paymentId || !paymentId.startsWith("tr_")) {
    return new Response(null, { status: 400 });
  }

  let payment: MolliePayment;
  try {
    payment = await mollieRequest<MolliePayment>(
      "GET",
      `payments/${encodeURIComponent(paymentId)}`,
    );
  } catch {
    return new Response(null, { status: 502 });
  }

  const remoteOrderId = payment.metadata?.remote_order_id ?? "";
  if (!remoteOrderId) {
    return new Response("OK", { status: 200 });
  }

  const orderRows = await db
    .select()
    .from(remoteOrders)
    .where(eq(remoteOrders.id, remoteOrderId))
    .limit(1);
  const order = orderRows[0];

  if (!order) {
    return new Response("OK", { status: 200 });
  }

  if (
    !order.molliePaymentId ||
    !safeEqual(order.molliePaymentId, paymentId)
  ) {
    return new Response("OK", { status: 200 });
  }

  await updateOrderFromPayment(order.id, payment);

  if (payment.status === "paid") {
    const notified = await notifyClientPaid(order, payment);
    if (!notified) {
      return new Response(null, { status: 503 });
    }
  }

  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function parseFormBody(
  request: Request,
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(json)) {
        out[key] = value == null ? "" : String(value);
      }
      return out;
    } catch {
      return {};
    }
  }

  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return out;
}
