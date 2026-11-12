import { sql } from "drizzle-orm";
import { db } from "@/db";
import { logger } from "@/lib/logger";

let schemaReady: Promise<void> | null = null;

/**
 * Ensures remote payment tables exist on the connected Postgres.
 * Safe to call on every request — runs once per cold start (CREATE IF NOT EXISTS).
 */
export async function ensureRemotePaymentSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "remote_orders" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "client_order_id" text NOT NULL,
            "access_token" text NOT NULL,
            "callback_url" text NOT NULL,
            "return_url" text NOT NULL,
            "cancel_url" text NOT NULL,
            "amount" text NOT NULL,
            "currency" varchar(3) NOT NULL,
            "product_name" text NOT NULL,
            "merchant_order_number" text,
            "integration_mode" text DEFAULT '' NOT NULL,
            "items" jsonb NOT NULL,
            "mollie_payment_id" text,
            "mollie_checkout_url" text,
            "payment_status" text DEFAULT 'created' NOT NULL,
            "payment_method" text,
            "callback_sent_at" timestamp with time zone,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
          )
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "remote_payment_nonces" (
            "nonce_hash" text PRIMARY KEY NOT NULL,
            "expires_at" timestamp with time zone NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
          )
        `);

        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS "remote_orders_mollie_payment_idx"
          ON "remote_orders" USING btree ("mollie_payment_id")
        `);

        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS "remote_orders_client_order_idx"
          ON "remote_orders" USING btree ("client_order_id")
        `);

        logger.info("Remote payment schema ensured");
      } catch (error) {
        schemaReady = null;
        logger.error({ err: error }, "Failed to ensure remote payment schema");
        throw error;
      }
    })();
  }

  await schemaReady;
}
