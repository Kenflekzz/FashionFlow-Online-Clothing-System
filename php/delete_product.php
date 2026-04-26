<?php
session_start();
header('Content-Type: application/json');
require_once 'check_privilege.php';

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

// Must have delete permission - this will exit if not allowed
requirePrivilege('products', 'delete', $conn);

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    echo json_encode(['status' => 400, 'message' => 'Invalid product ID']);
    $conn->close();
    exit;
}

// Check if product exists in any orders (can't hard delete if so)
$checkStmt = $conn->prepare("
    SELECT COUNT(*) as count 
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = ? AND o.status != 'cancelled'
");
$checkStmt->bind_param("i", $id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();
$inOrders = $checkResult->fetch_assoc()['count'] > 0;
$checkStmt->close();

if ($inOrders) {
    // Soft delete - mark as inactive and set deleted_at
    $stmt = $conn->prepare("UPDATE products SET status = 'inactive', deleted_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $id);
    $message = 'Product deactivated (exists in orders)';
} else {
    // Hard delete
    // First delete related images
    $conn->query("DELETE FROM product_images WHERE product_id = {$id}");
    // Then delete product
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    $message = 'Product deleted permanently';
}

if ($stmt->execute()) {
    echo json_encode([
        'status' => 200,
        'message' => $message,
        'id' => $id
    ]);
} else {
    echo json_encode(['status' => 500, 'message' => 'Delete failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>