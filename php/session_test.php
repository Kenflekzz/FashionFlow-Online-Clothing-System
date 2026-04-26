<?php
session_start();
header('Content-Type: application/json');

echo json_encode([
    'session_exists' => isset($_SESSION) ? 'yes' : 'no',
    'session_id' => session_id(),
    'session_data' => $_SESSION,
    'cookies' => $_COOKIE
]);
?>