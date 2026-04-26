<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]);
    exit;
}

$host = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbname = "fashionflow";

$conn = new mysqli($host, $dbUser, $dbPassword, $dbname);

if ($conn->connect_error) {
    echo json_encode(['success' => false]);
    exit;
}

$userId = $_SESSION['user_id'];

$stmt = $conn->prepare("UPDATE users SET last_active = NOW() WHERE user_ID = ?");
$stmt->bind_param("s", $userId);
$success = $stmt->execute();

echo json_encode(['success' => $success]);

$stmt->close();
$conn->close();
?>