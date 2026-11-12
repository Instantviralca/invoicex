Mollie Remote Payment Server
============================

Version 2.2.2 (order-id-only description)

Purpose
-------
Central WordPress payment server for multiple client websites using Mollie.

Credentials (this install)
--------------------------
1. credentials.php holds Mollie API key and Shared Secret only.
2. Currency is NOT hardcoded — each client order supplies its currency.
3. Upload this whole folder to: wp-content/plugins/mollieremotepayment-server/
4. Activate the plugin in WP Admin.
5. Values are applied automatically from credentials.php.
6. Confirm under: WP Admin > Mollie Remote Payment

Client plugin is configured separately (same Shared Secret + this site URL).

Supported client modes
----------------------
1. Legacy hosted-checkout clients using the existing signed payload.
2. v2.5 Components clients using integration_mode=components_v1 and a signed card_token hash.
3. Hosted-checkout clients that optionally send a signed merchant_order_number.

Merchant order number
---------------------
When merchant_order_number is present, it must contain only 1-12 digits and cannot start with zero.
It is included in the HMAC payload and is used only for the human-facing Mollie description, for example:

Order #1000

The original client order_id, Mollie payment ID, webhook identifiers, and callback reconciliation remain unchanged.
If merchant_order_number is absent, Mollie falls back to the existing client order_id in the description.

Security
--------
- Shared Secret must match the client plugin.
- Do not commit credentials.php to git.
- New optional fields that affect payment behavior are covered by the request HMAC.
- Components card tokens are never stored in WordPress; when received they are consumed immediately when creating the Mollie payment.
- Mollie payment status is re-fetched from Mollie for return and webhook handling.

Settings
--------
WP Admin > Mollie Remote Payment

Configure:
- Mollie API key
- Optional currency filter (leave empty to accept any client currency)
- Shared Secret
- Default Payment Description
- Mollie Description Format ({description} and {order_number} placeholders)

Webhook
-------
The plugin automatically sends its own Mollie webhook URL with each payment (?mrp=1).
No manual Mollie dashboard webhook is required for this plugin.

Version 2.2.2 changes
---------------------
- Mollie description now defaults to order number only: Order #{order_number}.
- Upgrading from v2.2.1 automatically migrates the previous default format to the order-number-only format.
- The format remains editable in WP Admin if a different format is ever needed.
- Client product descriptions may still be received for request compatibility, but the default Mollie-facing format does not display them.
- Currency is taken from each signed client request; optional admin filter only if set.
