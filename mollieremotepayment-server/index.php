<?php
/*
Plugin Name: WooCommerce Remote Payment - Mollie Server
Description: Remote WooCommerce payment collection server using Mollie hosted checkout.
Author: Adapted for Mollie
Version: 2.2.2
Requires at least: 6.0
Requires PHP: 7.4
*/

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Optional local credentials.php seeds Mollie API key and shared secret only.
 * Currency is not hardcoded — each client order supplies its own currency.
 */
function wrp_mollie_load_credentials_file() {
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    $file = __DIR__ . '/credentials.php';
    if (is_readable($file)) {
        require_once $file;
    }
}

function wrp_mollie_apply_credentials() {
    wrp_mollie_load_credentials_file();

    if (defined('WRP_MOLLIE_API_KEY') && is_string(WRP_MOLLIE_API_KEY) && WRP_MOLLIE_API_KEY !== '') {
        update_option('wrp_mollie_api_key', sanitize_text_field(WRP_MOLLIE_API_KEY));
    }
    if (defined('WRP_MOLLIE_SHARED_SECRET') && is_string(WRP_MOLLIE_SHARED_SECRET) && WRP_MOLLIE_SHARED_SECRET !== '') {
        update_option('wrp_mollie_shared_secret', sanitize_text_field(WRP_MOLLIE_SHARED_SECRET));
    }
}

register_activation_hook(__FILE__, 'wrp_mollie_apply_credentials');
add_action('admin_init', 'wrp_mollie_apply_credentials');

add_action('admin_init', 'wrp_mollie_server_migrate_222', 1);
function wrp_mollie_server_migrate_222() {
    $version = (string) get_option('wrp_mollie_server_version', '');
    if ($version === '2.2.2') {
        return;
    }

    // Migrate the previous plugin default to an order-number-only Mollie description.
    $format = (string) get_option('wrp_mollie_description_format', '');
    if ($format === '' || $format === '{description} - Order #{order_number}') {
        update_option('wrp_mollie_description_format', 'Order #{order_number}');
    }

    update_option('wrp_mollie_server_version', '2.2.2');
}

add_action('admin_menu', 'wrp_mollie_server_menu');
function wrp_mollie_server_menu() {
    add_menu_page(
        'Mollie Remote Payment Server',
        'Mollie Remote Payment',
        'manage_options',
        'wrp-mollie-server',
        'wrp_mollie_server_settings_page',
        'dashicons-money-alt'
    );
}

add_action('admin_init', 'wrp_mollie_server_register_settings');
function wrp_mollie_server_register_settings() {
    register_setting('wrp_mollie_server', 'wrp_mollie_api_key', array('sanitize_callback' => 'sanitize_text_field'));
    register_setting('wrp_mollie_server', 'wrp_mollie_currency', array('sanitize_callback' => 'wrp_mollie_sanitize_currency'));
    register_setting('wrp_mollie_server', 'wrp_mollie_shared_secret', array('sanitize_callback' => 'sanitize_text_field'));
    register_setting('wrp_mollie_server', 'wrp_mollie_default_description', array('sanitize_callback' => 'wrp_mollie_sanitize_description'));
    register_setting('wrp_mollie_server', 'wrp_mollie_description_format', array('sanitize_callback' => 'wrp_mollie_sanitize_description_format'));
}

function wrp_mollie_sanitize_currency($value) {
    $value = strtoupper(preg_replace('/[^A-Za-z]/', '', (string) $value));
    return strlen($value) === 3 ? $value : '';
}

function wrp_mollie_normalize_request_currency($value) {
    $currency = wrp_mollie_sanitize_currency($value);
    return $currency !== '' ? $currency : false;
}

function wrp_mollie_sanitize_description($value) {
    $value = trim(sanitize_text_field((string) $value));
    return substr($value, 0, 120);
}

function wrp_mollie_sanitize_description_format($value) {
    $value = trim(sanitize_text_field((string) $value));
    if ($value === '') {
        return 'Order #{order_number}';
    }

    // Keep only supported placeholders; unknown placeholders are stripped.
    $value = preg_replace('/\{(?!description\}|order_number\})[^}]+\}/', '', $value);
    return substr($value, 0, 180);
}

function wrp_mollie_default_description() {
    $value = wrp_mollie_sanitize_description(get_option('wrp_mollie_default_description', 'Online Order'));
    return $value !== '' ? $value : 'Online Order';
}

function wrp_mollie_build_description($description, $order_number) {
    $description = wrp_mollie_sanitize_description($description);
    if ($description === '') {
        $description = wrp_mollie_default_description();
    }

    $format = wrp_mollie_sanitize_description_format(get_option('wrp_mollie_description_format', 'Order #{order_number}'));
    $built = strtr($format, array(
        '{description}' => $description,
        '{order_number}' => sanitize_text_field((string) $order_number),
    ));
    $built = trim($built);

    return substr($built !== '' ? $built : $description, 0, 255);
}

function wrp_mollie_server_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $currency = wrp_mollie_sanitize_currency(get_option('wrp_mollie_currency', ''));
    $default_description = wrp_mollie_default_description();
    $description_format = get_option('wrp_mollie_description_format', 'Order #{order_number}');
    ?>
    <div class="wrap">
        <h1>WooCommerce Remote Payment - Mollie Server</h1>
        <p>Enter your Mollie API key and use the same Shared Secret in the client plugin. Currency is taken from each client order (not hardcoded).</p>
        <form method="post" action="options.php">
            <?php settings_fields('wrp_mollie_server'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="wrp_mollie_api_key">Mollie API Key</label></th>
                    <td>
                        <input id="wrp_mollie_api_key" type="password" name="wrp_mollie_api_key" value="<?php echo esc_attr(get_option('wrp_mollie_api_key')); ?>" class="regular-text" autocomplete="off" />
                        <p class="description">Use a <code>test_...</code> key for testing or a <code>live_...</code> key for production.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="wrp_mollie_currency">Optional Currency Filter</label></th>
                    <td>
                        <input id="wrp_mollie_currency" type="text" maxlength="3" name="wrp_mollie_currency" value="<?php echo esc_attr($currency); ?>" class="small-text" placeholder="any" />
                        <p class="description">Leave empty to accept each order’s currency from the client. If set (e.g. <code>GBP</code>), only that currency is accepted.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="wrp_mollie_shared_secret">Shared Secret</label></th>
                    <td>
                        <input id="wrp_mollie_shared_secret" type="password" name="wrp_mollie_shared_secret" value="<?php echo esc_attr(get_option('wrp_mollie_shared_secret')); ?>" class="regular-text" autocomplete="off" />
                        <p class="description">Use a long random value (32+ characters). Enter the exact same value in the client plugin.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="wrp_mollie_default_description">Default Payment Description</label></th>
                    <td>
                        <input id="wrp_mollie_default_description" type="text" maxlength="120" name="wrp_mollie_default_description" value="<?php echo esc_attr($default_description); ?>" class="regular-text" />
                        <p class="description">Used only when the client does not send a payment/product description. Example: <code>Online Order</code>.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="wrp_mollie_description_format">Mollie Description Format</label></th>
                    <td>
                        <input id="wrp_mollie_description_format" type="text" maxlength="180" name="wrp_mollie_description_format" value="<?php echo esc_attr($description_format); ?>" class="regular-text" />
                        <p class="description">Default: <code>Order #{order_number}</code>. Available placeholders: <code>{description}</code> and <code>{order_number}</code>. Keep the default if you want Mollie to show only the order ID.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Payment Webhook</th>
                    <td><code><?php echo esc_html(home_url('/?mrp=1')); ?></code><p class="description">This is sent automatically with each Mollie payment. No manual dashboard webhook is required for this plugin.</p></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

function wrp_mollie_api_request($method, $path, $body = null) {
    $api_key = trim((string) get_option('wrp_mollie_api_key'));
    if ($api_key === '' || !preg_match('/^(test|live)_[A-Za-z0-9]+$/', $api_key)) {
        return new WP_Error('wrp_mollie_key', 'A valid Mollie API key is not configured.');
    }

    $args = array(
        'method' => strtoupper($method),
        'timeout' => 45,
        'redirection' => 0,
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Accept' => 'application/hal+json',
            'Content-Type' => 'application/json',
        ),
    );

    if ($body !== null) {
        $args['body'] = wp_json_encode($body);
    }

    $response = wp_remote_request('https://api.mollie.com/v2/' . ltrim($path, '/'), $args);
    if (is_wp_error($response)) {
        return $response;
    }

    $status = (int) wp_remote_retrieve_response_code($response);
    $raw = wp_remote_retrieve_body($response);
    $data = json_decode($raw, true);

    if ($status < 200 || $status >= 300) {
        $message = isset($data['detail']) ? sanitize_text_field($data['detail']) : 'Mollie API request failed.';
        return new WP_Error('wrp_mollie_api', $message, array('status' => $status));
    }

    return is_array($data) ? $data : array();
}

function wrp_mollie_valid_remote_url($url) {
    $url = esc_url_raw((string) $url, array('http', 'https'));
    if (!$url || !wp_http_validate_url($url)) {
        return false;
    }
    return $url;
}

function wrp_mollie_normalize_merchant_order_number($value) {
    $value = trim((string) $value);
    if ($value === '') {
        return '';
    }
    return preg_match('/^[1-9][0-9]{0,11}$/', $value) ? $value : false;
}

function wrp_mollie_request_signature_payload($data) {
    $payload = array(
        (string) $data['order_id'],
        (string) $data['request_ts'],
        (string) $data['request_nonce'],
        (string) $data['callback_url'],
        (string) $data['return_url'],
        (string) $data['cancel_url'],
        (string) $data['amount'],
        (string) $data['currency'],
    );

    // product_name was added by later hosted clients while preserving older clients.
    if (isset($data['product_name']) && $data['product_name'] !== '') {
        $payload[] = (string) $data['product_name'];
    }

    // Optional human-facing merchant reference. When present it is always signed.
    if (isset($data['merchant_order_number']) && $data['merchant_order_number'] !== '') {
        $payload[] = (string) $data['merchant_order_number'];
    }

    $payload[] = hash('sha256', (string) $data['items_json']);

    // Backward compatibility for the v2.5 Mollie Components client.
    if (isset($data['integration_mode']) && $data['integration_mode'] === 'components_v1') {
        $payload[] = 'components_v1';
        $payload[] = hash('sha256', (string) $data['card_token']);
    }

    return implode('|', $payload);
}

function wrp_mollie_verify_client_request($data) {
    $secret = (string) get_option('wrp_mollie_shared_secret');
    if (strlen($secret) < 16) {
        return new WP_Error('wrp_secret', 'Remote payment Shared Secret is not configured on the server.');
    }

    $required = array('order_id', 'request_ts', 'request_nonce', 'callback_url', 'return_url', 'cancel_url', 'amount', 'currency', 'items_json', 'signature');
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            return new WP_Error('wrp_missing', 'Missing required remote payment data.');
        }
    }

    $timestamp = (int) $data['request_ts'];
    if ($timestamp < (time() - 900) || $timestamp > (time() + 300)) {
        return new WP_Error('wrp_expired', 'Remote payment request has expired.');
    }

    $nonce = sanitize_key($data['request_nonce']);
    if ($nonce === '' || get_transient('wrp_mollie_nonce_' . md5($nonce))) {
        return new WP_Error('wrp_replay', 'Remote payment request was already used.');
    }

    $merchant_order_number = isset($data['merchant_order_number']) ? wrp_mollie_normalize_merchant_order_number($data['merchant_order_number']) : '';
    if ($merchant_order_number === false) {
        return new WP_Error('wrp_merchant_order_number', 'Invalid merchant_order_number.');
    }

    $integration_mode = isset($data['integration_mode']) ? sanitize_key((string) $data['integration_mode']) : '';
    if ($integration_mode !== '' && $integration_mode !== 'components_v1') {
        return new WP_Error('wrp_integration_mode', 'Invalid remote payment integration mode.');
    }

    if ($integration_mode === 'components_v1') {
        $card_token = isset($data['card_token']) ? trim((string) $data['card_token']) : '';
        if ($card_token === '' || !preg_match('/^tkn_[A-Za-z0-9]+$/', $card_token)) {
            return new WP_Error('wrp_card_token', 'Invalid Mollie card token.');
        }
    } elseif (!empty($data['card_token'])) {
        return new WP_Error('wrp_card_token_mode', 'Card token is not valid for hosted checkout mode.');
    }

    $expected = hash_hmac('sha256', wrp_mollie_request_signature_payload($data), $secret);
    if (!hash_equals($expected, (string) $data['signature'])) {
        return new WP_Error('wrp_signature', 'Invalid remote payment signature.');
    }

    set_transient('wrp_mollie_nonce_' . md5($nonce), 1, 20 * MINUTE_IN_SECONDS);
    return true;
}

function wrp_mollie_remote_order_token($remote_order_id) {
    return (string) get_post_meta($remote_order_id, '_wrp_access_token', true);
}

function wrp_mollie_check_remote_order_token($remote_order_id) {
    $stored = wrp_mollie_remote_order_token($remote_order_id);
    $provided = isset($_GET['rt']) ? sanitize_text_field(wp_unslash($_GET['rt'])) : '';
    return $stored !== '' && $provided !== '' && hash_equals($stored, $provided);
}

function wrp_mollie_payment_matches_order($payment, $remote_order_id) {
    $expected_amount = number_format((float) get_post_meta($remote_order_id, '_wrp_amount', true), 2, '.', '');
    $expected_currency = strtoupper((string) get_post_meta($remote_order_id, '_wrp_currency', true));
    $actual_amount = isset($payment['amount']['value']) ? number_format((float) $payment['amount']['value'], 2, '.', '') : '';
    $actual_currency = isset($payment['amount']['currency']) ? strtoupper((string) $payment['amount']['currency']) : '';
    $stored_payment_id = (string) get_post_meta($remote_order_id, '_wrp_mollie_payment_id', true);

    return $expected_amount === $actual_amount
        && $expected_currency === $actual_currency
        && $stored_payment_id !== ''
        && isset($payment['id'])
        && hash_equals($stored_payment_id, (string) $payment['id']);
}

function wrp_mollie_update_remote_order_content($remote_order_id, $payment) {
    $status = isset($payment['status']) ? sanitize_text_field($payment['status']) : 'unknown';
    $payment_id = isset($payment['id']) ? sanitize_text_field($payment['id']) : '';
    $amount = isset($payment['amount']['value']) ? sanitize_text_field($payment['amount']['value']) : '';
    $currency = isset($payment['amount']['currency']) ? sanitize_text_field($payment['amount']['currency']) : '';
    $method = isset($payment['method']) && is_string($payment['method']) ? sanitize_text_field($payment['method']) : '';

    $content = '<strong>Provider:</strong> Mollie<br />';
    $content .= '<strong>Transaction ID:</strong> ' . esc_html($payment_id) . '<br />';
    $content .= '<strong>Status:</strong> ' . esc_html($status) . '<br />';
    $content .= '<strong>Amount:</strong> ' . esc_html($amount) . '<br />';
    $content .= '<strong>Currency:</strong> ' . esc_html($currency) . '<br />';
    if ($method !== '') {
        $content .= '<strong>Method:</strong> ' . esc_html($method) . '<br />';
    }

    wp_update_post(array(
        'ID' => $remote_order_id,
        'post_content' => wp_kses_post($content),
    ));
}

function wrp_mollie_notify_client_paid($remote_order_id, $payment) {
    if (get_post_meta($remote_order_id, '_wrp_callback_sent', true)) {
        return true;
    }

    if (!isset($payment['status']) || $payment['status'] !== 'paid' || !wrp_mollie_payment_matches_order($payment, $remote_order_id)) {
        return false;
    }

    $callback_url = wrp_mollie_valid_remote_url(get_post_meta($remote_order_id, '_wrp_callback_url', true));
    if (!$callback_url) {
        return false;
    }

    $order_id = (string) get_post_meta($remote_order_id, '_wrp_client_order_id', true);
    $payment_id = sanitize_text_field($payment['id']);
    $price = number_format((float) $payment['amount']['value'], 2, '.', '');
    $currency = strtoupper(sanitize_text_field($payment['amount']['currency']));
    $callback_ts = time();
    $secret = (string) get_option('wrp_mollie_shared_secret');
    $signature_payload = implode('|', array($order_id, $payment_id, $price, $currency, (string) $callback_ts));

    $payment_data = array(
        'order_id' => $order_id,
        'txn_id' => $payment_id,
        'mollie_payment_id' => $payment_id,
        'price' => $price,
        'currency_code' => $currency,
        'product_name' => sanitize_text_field((string) get_post_meta($remote_order_id, '_wrp_product_name', true)),
        'payment_status' => 'paid',
        'callback_ts' => $callback_ts,
        'signature' => hash_hmac('sha256', $signature_payload, $secret),
    );

    $response = wp_remote_post($callback_url, array(
        'method' => 'POST',
        'body' => $payment_data,
        'timeout' => 45,
        'sslverify' => true,
        'redirection' => 0,
    ));

    if (is_wp_error($response)) {
        return false;
    }

    $status = (int) wp_remote_retrieve_response_code($response);
    if ($status >= 200 && $status < 300) {
        update_post_meta($remote_order_id, '_wrp_callback_sent', gmdate('c'));
        return true;
    }

    return false;
}

function wrp_mollie_create_payment_for_remote_order($remote_order_id, $card_token = '') {
    $token = wrp_mollie_remote_order_token($remote_order_id);
    $amount = number_format((float) get_post_meta($remote_order_id, '_wrp_amount', true), 2, '.', '');
    $currency = strtoupper((string) get_post_meta($remote_order_id, '_wrp_currency', true));
    $client_order_id = (string) get_post_meta($remote_order_id, '_wrp_client_order_id', true);
    $product_name = sanitize_text_field((string) get_post_meta($remote_order_id, '_wrp_product_name', true));
    $merchant_order_number = wrp_mollie_normalize_merchant_order_number(get_post_meta($remote_order_id, '_wrp_merchant_order_number', true));

    if ($product_name === '') {
        $product_name = wrp_mollie_default_description();
    }
    if ($merchant_order_number === false) {
        $merchant_order_number = '';
    }

    $display_order_number = $merchant_order_number !== '' ? $merchant_order_number : $client_order_id;
    $metadata = array(
        'remote_order_id' => (string) $remote_order_id,
        'client_order_id' => (string) $client_order_id,
    );
    if ($merchant_order_number !== '') {
        $metadata['merchant_order_number'] = $merchant_order_number;
    }

    $payment_body = array(
        'amount' => array(
            'currency' => $currency,
            'value' => $amount,
        ),
        'description' => wrp_mollie_build_description($product_name, $display_order_number),
        'redirectUrl' => add_query_arg(array('ros' => $remote_order_id, 'rt' => $token), home_url('/')),
        'cancelUrl' => add_query_arg(array('rof' => $remote_order_id, 'rt' => $token), home_url('/')),
        'webhookUrl' => home_url('/?mrp=1'),
        'metadata' => $metadata,
    );

    if ($card_token !== '') {
        if (!preg_match('/^tkn_[A-Za-z0-9]+$/', $card_token)) {
            return new WP_Error('wrp_card_token', 'Invalid Mollie card token.');
        }
        $payment_body['method'] = 'creditcard';
        $payment_body['cardToken'] = $card_token;
    }

    $payment = wrp_mollie_api_request('POST', 'payments', $payment_body);
    if (is_wp_error($payment) || empty($payment['id']) || empty($payment['_links']['checkout']['href'])) {
        return is_wp_error($payment) ? $payment : new WP_Error('wrp_checkout_url', 'Mollie did not return a checkout URL.');
    }

    $checkout_url = esc_url_raw($payment['_links']['checkout']['href']);
    update_post_meta($remote_order_id, '_wrp_mollie_payment_id', sanitize_text_field($payment['id']));
    update_post_meta($remote_order_id, '_wrp_mollie_checkout_url', $checkout_url);
    wrp_mollie_update_remote_order_content($remote_order_id, $payment);

    return array(
        'payment' => $payment,
        'checkout_url' => $checkout_url,
    );
}

function wrp_mollie_process_remote_order() {
    // Signed health check used by the client settings screen.
    if (isset($_GET['wrp_mollie_health']) && (string) $_GET['wrp_mollie_health'] === '1') {
        if (strtoupper($_SERVER['REQUEST_METHOD']) !== 'POST') {
            wp_send_json(array('ok' => false, 'message' => 'POST required.'), 405);
        }

        $timestamp = isset($_POST['request_ts']) ? (int) $_POST['request_ts'] : 0;
        $signature = isset($_POST['signature']) ? sanitize_text_field(wp_unslash($_POST['signature'])) : '';
        $secret = trim((string) get_option('wrp_mollie_shared_secret'));

        if (strlen($secret) < 16 || $timestamp < (time() - 300) || $timestamp > (time() + 300)) {
            wp_send_json(array('ok' => false, 'message' => 'Shared Secret or server time is invalid.'), 403);
        }

        $expected = hash_hmac('sha256', 'health|' . $timestamp, $secret);
        if ($signature === '' || !hash_equals($expected, $signature)) {
            wp_send_json(array('ok' => false, 'message' => 'Shared Secret does not match.'), 403);
        }

        $api_key = trim((string) get_option('wrp_mollie_api_key'));
        if ($api_key === '' || !preg_match('/^(test|live)_[A-Za-z0-9]+$/', $api_key)) {
            wp_send_json(array('ok' => false, 'message' => 'A valid Mollie API key is not configured.'), 503);
        }

        $profile = wrp_mollie_api_request('GET', 'profiles/me');
        if (is_wp_error($profile) || empty($profile['id']) || strpos((string) $profile['id'], 'pfl_') !== 0) {
            wp_send_json(array('ok' => false, 'message' => 'Could not load the Mollie profile for this API key.'), 503);
        }

        $server_currency = wrp_mollie_sanitize_currency(get_option('wrp_mollie_currency', ''));
        wp_send_json(array(
            'ok' => true,
            'currency' => $server_currency !== '' ? $server_currency : 'any',
            'profile_id' => sanitize_text_field((string) $profile['id']),
            'testmode' => strpos($api_key, 'test_') === 0,
            'hosted_checkout' => true,
        ), 200);
    }

    // Create remote order from the WooCommerce client.
    if (isset($_GET['ro']) && (string) $_GET['ro'] === '1') {
        if (strtoupper($_SERVER['REQUEST_METHOD']) !== 'POST') {
            status_header(405);
            exit;
        }

        $data = array();
        $fields = array('order_id', 'request_ts', 'request_nonce', 'callback_url', 'return_url', 'cancel_url', 'amount', 'currency', 'product_name', 'merchant_order_number', 'items_json', 'integration_mode', 'card_token', 'signature');
        foreach ($fields as $field) {
            $data[$field] = isset($_POST[$field]) ? wp_unslash($_POST[$field]) : '';
        }

        $verified = wrp_mollie_verify_client_request($data);
        if (is_wp_error($verified)) {
            status_header(403);
            echo esc_html($verified->get_error_message());
            exit;
        }

        $api_key = trim((string) get_option('wrp_mollie_api_key'));
        if ($api_key === '' || !preg_match('/^(test|live)_[A-Za-z0-9]+$/', $api_key)) {
            status_header(503);
            echo 'A valid Mollie API key is not configured on the payment server.';
            exit;
        }

        $callback_url = wrp_mollie_valid_remote_url($data['callback_url']);
        $return_url = wrp_mollie_valid_remote_url($data['return_url']);
        $cancel_url = wrp_mollie_valid_remote_url($data['cancel_url']);
        $amount = number_format((float) $data['amount'], 2, '.', '');
        $currency = wrp_mollie_normalize_request_currency($data['currency']);
        $product_name = sanitize_text_field($data['product_name']);
        if ($product_name === '') {
            $product_name = wrp_mollie_default_description();
        }
        $product_name = substr($product_name, 0, 64);
        $merchant_order_number = wrp_mollie_normalize_merchant_order_number($data['merchant_order_number']);
        if ($merchant_order_number === false) {
            status_header(400);
            echo 'Invalid merchant_order_number.';
            exit;
        }
        $integration_mode = sanitize_key((string) $data['integration_mode']);
        $server_currency = wrp_mollie_sanitize_currency(get_option('wrp_mollie_currency', ''));
        $items = json_decode((string) $data['items_json'], true);

        if (!$callback_url || !$return_url || !$cancel_url || (float) $amount <= 0 || $currency === false || !is_array($items)) {
            status_header(400);
            echo 'Invalid remote payment data.';
            exit;
        }

        // Optional filter only: if an admin currency is set, enforce it. Otherwise accept the client's currency.
        if ($server_currency !== '' && $currency !== $server_currency) {
            status_header(400);
            echo 'Invalid remote payment currency.';
            exit;
        }

        $order_id = absint($data['order_id']);
        if ($order_id <= 0) {
            status_header(400);
            echo 'Invalid order ID.';
            exit;
        }

        $post_id = wp_insert_post(array(
            'post_title' => 'Order#' . $order_id,
            'post_type' => 'remoteorder',
            'post_content' => '',
            'post_status' => 'publish',
        ), true);

        if (is_wp_error($post_id) || !$post_id) {
            status_header(500);
            echo 'Could not create remote order.';
            exit;
        }

        $access_token = wp_generate_password(32, false, false);
        update_post_meta($post_id, '_wrp_client_order_id', $order_id);
        update_post_meta($post_id, '_wrp_callback_url', $callback_url);
        update_post_meta($post_id, '_wrp_return_url', $return_url);
        update_post_meta($post_id, '_wrp_cancel_url', $cancel_url);
        update_post_meta($post_id, '_wrp_items', $items);
        update_post_meta($post_id, '_wrp_amount', $amount);
        update_post_meta($post_id, '_wrp_currency', $currency);
        update_post_meta($post_id, '_wrp_product_name', $product_name);
        if ($merchant_order_number !== '') {
            update_post_meta($post_id, '_wrp_merchant_order_number', $merchant_order_number);
        }
        update_post_meta($post_id, '_wrp_integration_mode', $integration_mode);
        update_post_meta($post_id, '_wrp_access_token', $access_token);

        // v2.5 Components compatibility: consume the short-lived card token immediately.
        // Never persist card_token in WordPress. The response remains a URL as expected by clients.
        if ($integration_mode === 'components_v1') {
            $payment_result = wrp_mollie_create_payment_for_remote_order($post_id, (string) $data['card_token']);
            if (is_wp_error($payment_result)) {
                status_header(502);
                echo esc_html($payment_result->get_error_message());
                exit;
            }
            echo esc_url_raw($payment_result['checkout_url']);
            exit;
        }

        echo esc_url_raw(add_query_arg(array('rop' => $post_id, 'rt' => $access_token), home_url('/')));
        exit;
    }

    // Create/reuse Mollie payment and redirect to hosted checkout.
    if (isset($_GET['rop'])) {
        $remote_order_id = absint($_GET['rop']);
        $post = get_post($remote_order_id);
        if (!$post || $post->post_type !== 'remoteorder' || !wrp_mollie_check_remote_order_token($remote_order_id)) {
            status_header(404);
            exit;
        }

        $checkout_url = (string) get_post_meta($remote_order_id, '_wrp_mollie_checkout_url', true);
        $payment_id = (string) get_post_meta($remote_order_id, '_wrp_mollie_payment_id', true);

        if ($payment_id !== '') {
            $existing_payment = wrp_mollie_api_request('GET', 'payments/' . rawurlencode($payment_id));
            if (!is_wp_error($existing_payment) && isset($existing_payment['status']) && in_array($existing_payment['status'], array('open', 'pending'), true) && $checkout_url !== '') {
                wp_redirect($checkout_url, 303);
                exit;
            }
            if (!is_wp_error($existing_payment) && isset($existing_payment['status']) && $existing_payment['status'] === 'paid') {
                wrp_mollie_notify_client_paid($remote_order_id, $existing_payment);
                wp_redirect(get_post_meta($remote_order_id, '_wrp_return_url', true), 303);
                exit;
            }
        }

        $payment_result = wrp_mollie_create_payment_for_remote_order($remote_order_id);
        if (is_wp_error($payment_result)) {
            status_header(502);
            wp_die(esc_html($payment_result->get_error_message()), 'Mollie Payment Error', array('response' => 502));
        }

        wp_redirect($payment_result['checkout_url'], 303);
        exit;
    }

    // Customer return. Fetch status from Mollie; do not trust the redirect itself.
    if (isset($_GET['ros'])) {
        $remote_order_id = absint($_GET['ros']);
        $post = get_post($remote_order_id);
        if (!$post || $post->post_type !== 'remoteorder' || !wrp_mollie_check_remote_order_token($remote_order_id)) {
            status_header(404);
            exit;
        }

        $payment_id = (string) get_post_meta($remote_order_id, '_wrp_mollie_payment_id', true);
        if ($payment_id !== '') {
            $payment = wrp_mollie_api_request('GET', 'payments/' . rawurlencode($payment_id));
            if (!is_wp_error($payment)) {
                wrp_mollie_update_remote_order_content($remote_order_id, $payment);
                if (isset($payment['status']) && $payment['status'] === 'paid') {
                    wrp_mollie_notify_client_paid($remote_order_id, $payment);
                }
            }
        }

        wp_redirect(get_post_meta($remote_order_id, '_wrp_return_url', true), 303);
        exit;
    }

    // Customer canceled payment.
    if (isset($_GET['rof'])) {
        $remote_order_id = absint($_GET['rof']);
        $post = get_post($remote_order_id);
        if (!$post || $post->post_type !== 'remoteorder' || !wrp_mollie_check_remote_order_token($remote_order_id)) {
            status_header(404);
            exit;
        }
        wp_redirect(get_post_meta($remote_order_id, '_wrp_cancel_url', true), 303);
        exit;
    }

    // Mollie payment webhook. Mollie posts the payment ID; always refetch status from the API.
    if (isset($_GET['mrp']) && (string) $_GET['mrp'] === '1') {
        if (strtoupper($_SERVER['REQUEST_METHOD']) !== 'POST') {
            status_header(405);
            exit;
        }

        $payment_id = isset($_POST['id']) ? sanitize_text_field(wp_unslash($_POST['id'])) : '';
        if ($payment_id === '' || strpos($payment_id, 'tr_') !== 0) {
            status_header(400);
            exit;
        }

        $payment = wrp_mollie_api_request('GET', 'payments/' . rawurlencode($payment_id));
        if (is_wp_error($payment)) {
            status_header(502);
            exit;
        }

        $remote_order_id = 0;
        if (isset($payment['metadata']['remote_order_id'])) {
            $remote_order_id = absint($payment['metadata']['remote_order_id']);
        }

        $post = $remote_order_id ? get_post($remote_order_id) : null;
        if (!$post || $post->post_type !== 'remoteorder') {
            status_header(200);
            exit;
        }

        $stored_payment_id = (string) get_post_meta($remote_order_id, '_wrp_mollie_payment_id', true);
        if ($stored_payment_id === '' || !hash_equals($stored_payment_id, $payment_id)) {
            status_header(200);
            exit;
        }

        wrp_mollie_update_remote_order_content($remote_order_id, $payment);

        if (isset($payment['status']) && $payment['status'] === 'paid') {
            if (!wrp_mollie_notify_client_paid($remote_order_id, $payment)) {
                // Non-2xx makes Mollie retry the webhook, useful if the client site is temporarily unavailable.
                status_header(503);
                exit;
            }
        }

        status_header(200);
        echo 'OK';
        exit;
    }
}
add_action('init', 'wrp_mollie_process_remote_order', 1);

function wrp_mollie_register_order_type() {
    $labels = array(
        'name' => __('Remote Orders', 'wrp-mollie'),
        'singular_name' => __('Remote Order', 'wrp-mollie'),
        'menu_name' => __('Remote Orders', 'wrp-mollie'),
        'name_admin_bar' => __('Remote Order', 'wrp-mollie'),
        'all_items' => __('All Remote Orders', 'wrp-mollie'),
        'search_items' => __('Search Remote Orders', 'wrp-mollie'),
        'not_found' => __('No remote orders found.', 'wrp-mollie'),
        'not_found_in_trash' => __('No remote orders found in Trash.', 'wrp-mollie'),
    );

    register_post_type('remoteorder', array(
        'labels' => $labels,
        'public' => false,
        'exclude_from_search' => true,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_in_nav_menus' => false,
        'show_in_menu' => true,
        'query_var' => false,
        'rewrite' => false,
        'capability_type' => 'post',
        'has_archive' => false,
        'hierarchical' => false,
        'supports' => array('editor'),
    ));
}
add_action('init', 'wrp_mollie_register_order_type');
