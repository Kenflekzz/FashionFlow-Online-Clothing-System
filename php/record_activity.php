<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(0);

$host = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbname = "fashionflow";

$conn = @new mysqli($host, $dbUser, $dbPassword, $dbname);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

$user_id = $data['user_id'] ?? null;
$username = $data['username'] ?? '';
$role = $data['role'] ?? 'user';
$activity_type = $data['activity_type'] ?? '';
$description = $data['description'] ?? '';
$ip_address = $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$device = $data['device'] ?? 'Unknown';
$performed_by = $data['performed_by'] ?? $username;

// Convert IPv6 localhost to IPv4
if ($ip_address === '::1') {
    $ip_address = '127.0.0.1';
} elseif (strpos($ip_address, '::ffff:') === 0) {
    $ip_address = substr($ip_address, 7);
}

$sql = "INSERT INTO activity_log (user_id, username, role, activity_type, description, ip_address, device, performed_by, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssssss", $user_id, $username, $role, $activity_type, $description, $ip_address, $device, $performed_by);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Activity recorded', 'id' => $stmt->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to record activity: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>