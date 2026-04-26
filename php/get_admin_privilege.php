<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    echo json_encode(['status' => 403, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$stmt = $conn->prepare("
    SELECT module, can_create, can_read, can_update, can_delete, can_block
    FROM user_privileges
    WHERE user_id = ?
");
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();

$privileges = [];

while ($row = $result->fetch_assoc()) {
    $module = $row['module'];

    // ✅ FIXED: Use "can_" prefix to match JavaScript expectations
    $privileges[$module] = [
        'can_create' => (bool)$row['can_create'],
        'can_read'   => (bool)$row['can_read'],
        'can_update' => (bool)$row['can_update'],
        'can_delete' => (bool)$row['can_delete'],
        'can_block'  => (bool)$row['can_block'],
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    'status' => 200,
    'privileges' => $privileges
]);
?>