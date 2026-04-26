<?php
session_start();
header('Content-Type: application/json');
require_once 'check_privilege.php';

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

// Must have update permission - this will exit if not allowed
requirePrivilege('orders', 'update', $conn);

$orderId = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
$newStatus = isset($_POST['status']) ? $_POST['status'] : '';

$validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
if ($orderId <= 0 || !in_array($newStatus, $validStatuses)) {
    echo json_encode(['status' => 400, 'message' => 'Invalid order ID or status']);
    $conn->close();
    exit;
}

// Get current status for history
$currentStmt = $conn->prepare("SELECT status FROM orders WHERE id = ?");
$currentStmt->bind_param("i", $orderId);
$currentStmt->execute();
$currentResult = $currentStmt->get_result();

if ($currentResult->num_rows === 0) {
    $currentStmt->close();
    $conn->close();
    echo json_encode(['status' => 404, 'message' => 'Order not found']);
    exit;
}

$currentStatus = $currentResult->fetch_assoc()['status'];
$currentStmt->close();

// Update order
$updateFields = "status = ?, updated_at = NOW()";
if ($newStatus === 'delivered') {
    $updateFields .= ", delivered_at = NOW()";
}

$stmt = $conn->prepare("UPDATE orders SET {$updateFields} WHERE id = ?");
$stmt->bind_param("si", $newStatus, $orderId);

if ($stmt->execute()) {
    // Add to order history
    $adminId = $_SESSION['user_id'] ?? 0;
    $note = "Status changed from {$currentStatus} to {$newStatus}";
    
    $histStmt = $conn->prepare("INSERT INTO order_history (order_id, status, note, created_by, created_at) VALUES (?, ?, ?, ?, NOW())");
    $histStmt->bind_param("issi", $orderId, $newStatus, $note, $adminId);
    $histStmt->execute();
    $histStmt->close();
    
    echo json_encode([
        'status' => 200,
        'message' => 'Order status updated',
        'order_id' => $orderId,
        'previous_status' => $currentStatus,
        'new_status' => $newStatus
    ]);
} else {
    echo json_encode(['status' => 500, 'message' => 'Update failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>