/**
 * WooCommerce remote Mollie payment server — off by default in production so
 * public crawlers (e.g. merchant onboarding) do not see payment-server endpoints.
 * Set MOLLIE_REMOTE_ENABLED=true only when actively using the WP client plugin.
 */
export function isMollieRemotePaymentServerEnabled(): boolean {
  const raw = process.env.MOLLIE_REMOTE_ENABLED?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return process.env.NODE_ENV !== "production";
}
