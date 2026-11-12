import { describe, expect, it } from "vitest";
import {
  normalizeClientCurrency,
  normalizeServerCurrencyConfig,
  resolveRemotePaymentCurrency,
  serverCurrencyHealthLabel,
} from "@/lib/mollie/remote-currency";

describe("remote payment currency", () => {
  describe("normalizeServerCurrencyConfig", () => {
    it("treats empty and ANY as wildcard", () => {
      expect(normalizeServerCurrencyConfig("")).toBe("ANY");
      expect(normalizeServerCurrencyConfig("   ")).toBe("ANY");
      expect(normalizeServerCurrencyConfig(undefined)).toBe("ANY");
      expect(normalizeServerCurrencyConfig("any")).toBe("ANY");
      expect(normalizeServerCurrencyConfig("ANY")).toBe("ANY");
      expect(normalizeServerCurrencyConfig(" Any ")).toBe("ANY");
    });

    it("keeps specific ISO currencies as strict filters", () => {
      expect(normalizeServerCurrencyConfig("gbp")).toBe("GBP");
      expect(normalizeServerCurrencyConfig("USD")).toBe("USD");
      expect(normalizeServerCurrencyConfig(" eur ")).toBe("EUR");
    });
  });

  describe("normalizeClientCurrency", () => {
    it("accepts valid 3-letter codes", () => {
      expect(normalizeClientCurrency("gbp")).toBe("GBP");
      expect(normalizeClientCurrency("USD")).toBe("USD");
      expect(normalizeClientCurrency(" eur ")).toBe("EUR");
    });

    it("rejects empty, ANY, and malformed values", () => {
      expect(normalizeClientCurrency("")).toBeNull();
      expect(normalizeClientCurrency("   ")).toBeNull();
      expect(normalizeClientCurrency("ANY")).toBeNull();
      expect(normalizeClientCurrency("any")).toBeNull();
      expect(normalizeClientCurrency("GB")).toBeNull();
      expect(normalizeClientCurrency("GBPP")).toBeNull();
      expect(normalizeClientCurrency("12$")).toBeNull();
      expect(normalizeClientCurrency("US1")).toBeNull();
    });
  });

  describe("resolveRemotePaymentCurrency", () => {
    it("Server ANY + Client GBP/USD/EUR → accepted with client currency for Mollie", () => {
      for (const client of ["GBP", "USD", "EUR", "gbp"]) {
        const result = resolveRemotePaymentCurrency("ANY", client);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.serverMode).toBe("ANY");
          expect(result.clientCurrency).toBe(client.trim().toUpperCase());
          expect(result.clientCurrency).not.toBe("ANY");
        }
      }

      const emptyConfig = resolveRemotePaymentCurrency("", "GBP");
      expect(emptyConfig.ok).toBe(true);
      if (emptyConfig.ok) {
        expect(emptyConfig.clientCurrency).toBe("GBP");
      }
    });

    it("Server GBP + Client GBP → accepted", () => {
      const result = resolveRemotePaymentCurrency("GBP", "gbp");
      expect(result).toEqual({
        ok: true,
        clientCurrency: "GBP",
        serverMode: "GBP",
      });
    });

    it("Server GBP + Client USD → rejected", () => {
      const result = resolveRemotePaymentCurrency("GBP", "USD");
      expect(result).toEqual({ ok: false, reason: "currency_mismatch" });
    });

    it("Server USD + Client GBP → rejected", () => {
      const result = resolveRemotePaymentCurrency("USD", "GBP");
      expect(result).toEqual({ ok: false, reason: "currency_mismatch" });
    });

    it("rejects empty, ANY, and malformed client currencies even when server is ANY", () => {
      expect(resolveRemotePaymentCurrency("ANY", "")).toEqual({
        ok: false,
        reason: "invalid_client_currency",
      });
      expect(resolveRemotePaymentCurrency("ANY", "ANY")).toEqual({
        ok: false,
        reason: "invalid_client_currency",
      });
      expect(resolveRemotePaymentCurrency("ANY", "any")).toEqual({
        ok: false,
        reason: "invalid_client_currency",
      });
      expect(resolveRemotePaymentCurrency("ANY", "GB")).toEqual({
        ok: false,
        reason: "invalid_client_currency",
      });
      expect(resolveRemotePaymentCurrency("ANY", "$$$$")).toEqual({
        ok: false,
        reason: "invalid_client_currency",
      });
    });

    it("never returns ANY as the Mollie payment currency", () => {
      const cases = [
        resolveRemotePaymentCurrency("any", "GBP"),
        resolveRemotePaymentCurrency("", "USD"),
        resolveRemotePaymentCurrency("EUR", "EUR"),
      ];
      for (const result of cases) {
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.clientCurrency).not.toBe("ANY");
          expect(result.clientCurrency).toMatch(/^[A-Z]{3}$/);
        }
      }
    });
  });

  describe("serverCurrencyHealthLabel", () => {
    it("reports lowercase any for wildcard configs", () => {
      expect(serverCurrencyHealthLabel("")).toBe("any");
      expect(serverCurrencyHealthLabel("ANY")).toBe("any");
      expect(serverCurrencyHealthLabel("any")).toBe("any");
    });

    it("reports specific currencies uppercase", () => {
      expect(serverCurrencyHealthLabel("gbp")).toBe("GBP");
    });
  });
});
