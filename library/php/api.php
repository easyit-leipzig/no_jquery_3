<?php
// api.php
// Einfacher PHP endpoint für das Demo von nojquery 3.0.2
// - behandelt JSON POST und FormData POST
// - gibt JSON zurück
// Sicherheit: Für Produktion unbedingt Token/CSRF und strengere Validierung hinzufügen.

header('Content-Type: application/json; charset=utf-8');

// Optional: für lokale Entwicklung CORS erlauben (entfernen/lockdown für Produktion)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // CORS preflight
    exit;
}

$raw = file_get_contents('php://input');
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : '';

$response = [
    'ok' => false,
    'received' => null,
    'note' => '',
];

// Try to parse JSON body first
$bodyJson = null;
if (stripos($contentType, 'application/json') !== false) {
    $bodyJson = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $response['received'] = $bodyJson;
        $response['ok'] = true;
        $response['note'] = 'json_parsed';
    } else {
        $response['note'] = 'invalid_json';
        http_response_code(400);
        echo json_encode($response, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    // Fallback: check $_POST (form-data or x-www-form-urlencoded)
    if (!empty($_POST)) {
        $response['received'] = $_POST;
        $response['ok'] = true;
        $response['note'] = 'form_post';
    } else {
        // Some fetch calls might send raw data (e.g. nj.ajax.postForm using FormData via fetch).
        // Try to parse multipart/form-data via $_POST is already done; else treat as raw fallback.
        // If nothing found, return informative response.
        // Try to parse as query string
        parse_str($raw, $parsed);
        if (!empty($parsed)) {
            $response['received'] = $parsed;
            $response['ok'] = true;
            $response['note'] = 'raw_parsed_querystring';
        } else {
            $response['note'] = 'no_input_detected';
            http_response_code(400);
            echo json_encode($response, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}

// Basic action handling for demo: echo / formEcho / time
$in = $response['received'];
$act = null;
if (is_array($in) && isset($in['action'])) $act = $in['action'];

switch ($act) {
    case 'echo':
        $result = [
            'action' => 'echo',
            'payload' => $in,
            'serverTime' => date('c'),
        ];
        echo json_encode(['ok'=>true,'result'=>$result], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        break;

    case 'formEcho':
        // When using postForm, nj.ajax.postForm returns text. We still return JSON.
        echo json_encode(['ok'=>true,'result'=>['action'=>'formEcho','payload'=>$in,'server'=>date('c')]], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        break;

    default:
        // generic reply
        echo json_encode(['ok'=>true,'result'=>['received'=>$in,'serverTime'=>date('c')]], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        break;
}

