<?php
/**
 * Copy to credentials.php and fill in real values.
 * Currency is not set here — each client order sends its own currency.
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WRP_MOLLIE_API_KEY', 'live_or_test_your_key_here');
define('WRP_MOLLIE_SHARED_SECRET', 'same-secret-as-client-plugin');
