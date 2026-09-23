<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$backendCandidates = [
    dirname(__DIR__).'/ascend-app',
    dirname(__DIR__, 2).'/ascend-app',
];

$backendRoot = null;

foreach ($backendCandidates as $candidate) {
    if (is_file($candidate.'/bootstrap/app.php')) {
        $backendRoot = $candidate;
        break;
    }
}

if ($backendRoot === null) {
    http_response_code(500);
    exit('ASCEND backend not found. Expected ascend-app beside the domain document root.');
}

if (is_file($maintenance = $backendRoot.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $backendRoot.'/vendor/autoload.php';

$app = require_once $backendRoot.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
