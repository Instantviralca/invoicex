-- Remote Mollie payment hub (WooCommerce client compatible)
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
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "remote_payment_nonces" (
	"nonce_hash" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "remote_orders_mollie_payment_idx" ON "remote_orders" USING btree ("mollie_payment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "remote_orders_client_order_idx" ON "remote_orders" USING btree ("client_order_id");
