<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    echo json_encode(['status' => 403, 'message' => 'Unauthorized']);
    exit;
}

// Optional: check if the user has delete privilege
$userId = (int) $_SESSION['user_id'];

// Connect to DB
$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

// Check if the log ID is provided
$logId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($logId <= 0) {
    echo json_encode(['status' => 400, 'message' => 'Invalid log ID']);
    exit;
}

// Optional: verify this admin can delete logs
$stmtCheck = $conn->prepare("SELECT can_delete FROM user_privileges WHERE user_id=? LIMIT 1");
$stmtCheck->bind_param("i", $userId);
$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();
$priv = $resultCheck->fetch_assoc();
if (!$priv || $priv['can_delete'] != 1) {
    echo json_encode(['status' => 403, 'message' => 'Permission denied']);
    exit;
}
$stmtCheck->close();

// Delete the log
$stmt = $conn->prepare("DELETE FROM security_logs WHERE id=?");
$stmt->bind_param("i", $logId);

if ($stmt->execute()) {
    echo json_encode(['status' => 200, 'message' => 'Log deleted']);
} else {
    echo json_encode(['status' => 500, 'message' => 'Failed to delete log']);
}

$stmt->close();
$conn->close();