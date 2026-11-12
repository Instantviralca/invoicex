/**
 * Remote Mollie payment currency rules.
 * "ANY" is a server-side wildcard only — never send it to Mollie.
 */

export type ServerCurrencyMode = "ANY" | string;

export type CurrencyResolution =
  | { ok: true; clientCurrency: string; serverMode: ServerCurrencyMode }
  | { ok: false; reason: "invalid_client_currency" | "currency_mismatch" };

/** Letters-only uppercase trim; empty if nothing left. */
export function normalizeCurrencyToken(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * Server config from env / settings.
 * Empty, missing, or "ANY" → wildcard mode.
 * Specific 3-letter ISO → strict filter.
 */
export function normalizeServerCurrencyConfig(
  configured: string | null | undefined,
): ServerCurrencyMode {
  const token = normalizeCurrencyToken(configured ?? "");
  if (!token || token === "ANY") {
    return "ANY";
  }
  // Only accept exact 3-letter ISO codes as a hard filter.
  if (token.length === 3) {
    return token;
  }
  // Malformed server config falls back to accepting any client currency.
  return "ANY";
}

/**
 * Client/order currency for Mollie.
 * Rejects empty, ANY, and non-3-letter values.
 */
export function normalizeClientCurrency(value: string): string | null {
  const token = normalizeCurrencyToken(value);
  if (!token || token === "ANY" || token.length !== 3) {
    return null;
  }
  return token;
}

/**
 * Decide whether to accept the client currency and what to send to Mollie.
 * Mollie always receives clientCurrency when ok — never "ANY".
 */
export function resolveRemotePaymentCurrency(
  configuredServerCurrency: string | null | undefined,
  incomingClientCurrency: string,
): CurrencyResolution {
  const serverMode = normalizeServerCurrencyConfig(configuredServerCurrency);
  const clientCurrency = normalizeClientCurrency(incomingClientCurrency);

  if (!clientCurrency) {
    return { ok: false, reason: "invalid_client_currency" };
  }

  if (serverMode !== "ANY" && clientCurrency !== serverMode) {
    return { ok: false, reason: "currency_mismatch" };
  }

  return { ok: true, clientCurrency, serverMode };
}

/** Value reported by the health/connection test endpoint. */
export function serverCurrencyHealthLabel(
  configuredServerCurrency: string | null | undefined,
): string {
  const mode = normalizeServerCurrencyConfig(configuredServerCurrency);
  return mode === "ANY" ? "any" : mode;
}
