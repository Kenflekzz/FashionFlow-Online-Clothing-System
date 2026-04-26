<?php
session_start();

ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');

// Allow both super admin and admin
if (!isset($_SESSION['account_status']) ||
    !in_array($_SESSION['account_status'], ['super admin', 'admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$userId = $data['user_id'] ?? '';
if (empty($userId)) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    $conn->close();
    exit;
}

// Sanitize optional fields
$data['M_I']               = $data['M_I']               ?? '';
$data['Extension']         = $data['Extension']         ?? '';
$data['birthdate']         = !empty($data['birthdate'])  ? $data['birthdate'] : null;
$data['sex']               = $data['sex']               ?? '';
$data['purok']             = $data['purok']             ?? '';
$data['barangay']          = $data['barangay']          ?? '';
$data['City_Municipality'] = $data['City_Municipality'] ?? '';
$data['province']          = $data['province']          ?? '';
$data['country']           = $data['country']           ?? 'Philippines';
$data['zip_code']          = $data['zip_code']          ?? '';
$data['status']            = $data['status']            ?? 'Active';

// Check for duplicate email (excluding current user)
if (!empty($data['email'])) {
    $stmt = $conn->prepare("SELECT user_ID FROM users WHERE email = ? AND user_ID != ?");
    $stmt->bind_param("ss", $data['email'], $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        $conn->close();
        echo json_encode(['success' => false, 'message' => 'Email already in use by another account']);
        exit;
    }
    $stmt->close();
}

// Check for duplicate username (excluding current user)
if (!empty($data['username'])) {
    $stmt = $conn->prepare("SELECT user_ID FROM users WHERE username = ? AND user_ID != ?");
    $stmt->bind_param("ss", $data['username'], $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        $conn->close();
        echo json_encode(['success' => false, 'message' => 'Username already in use by another account']);
        exit;
    }
    $stmt->close();
}

// Keep existing role — admin dashboard does not change roles
if (!empty($data['account_status']) && in_array($data['account_status'], ['user', 'admin', 'super admin'])) {
    $accountStatus = $data['account_status'];
} else {
    $roleStmt = $conn->prepare("SELECT account_status FROM users WHERE user_ID = ?");
    $roleStmt->bind_param("s", $userId);
    $roleStmt->execute();
    $roleRow       = $roleStmt->get_result()->fetch_assoc();
    $roleStmt->close();
    $accountStatus = $roleRow['account_status'] ?? 'user';
}

// Update user
$stmt = $conn->prepare("
    UPDATE users SET
        Fname              = ?,
        M_I                = ?,
        Lname              = ?,
        Extension          = ?,
        birthdate          = ?,
        sex                = ?,
        username           = ?,
        email              = ?,
        status             = ?,
        account_status     = ?,
        purok              = ?,
        barangay           = ?,
        City_Municipality  = ?,
        province           = ?,
        country            = ?,
        zip_code           = ?
    WHERE user_ID = ?
");

$stmt->bind_param("sssssssssssssssss",
    $data['Fname'],
    $data['M_I'],
    $data['Lname'],
    $data['Extension'],
    $data['birthdate'],
    $data['sex'],
    $data['username'],
    $data['email'],
    $data['status'],
    $accountStatus,
    $data['purok'],
    $data['barangay'],
    $data['City_Municipality'],
    $data['province'],
    $data['country'],
    $data['zip_code'],
    $userId
);

if ($stmt->execute()) {
    // Save privileges if provided
    if (!empty($data['privileges']) && is_array($data['privileges'])) {
        $delStmt = $conn->prepare("DELETE FROM user_privileges WHERE user_id = ?");
        $delStmt->bind_param("s", $userId);
        $delStmt->execute();
        $delStmt->close();

        $privStmt = $conn->prepare("
            INSERT INTO user_privileges
                (user_id, module, can_create, can_read, can_update, can_delete, can_block)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($data['privileges'] as $module => $actions) {
            $can_create = in_array('create', $actions) ? 1 : 0;
            $can_read   = in_array('read',   $actions) ? 1 : 0;
            $can_update = in_array('update', $actions) ? 1 : 0;
            $can_delete = in_array('delete', $actions) ? 1 : 0;
            $can_block  = in_array('block',  $actions) ? 1 : 0;

            $privStmt->bind_param("ssiiiii",
                $userId, $module,
                $can_create, $can_read, $can_update, $can_delete, $can_block
            );
            $privStmt->execute();
        }
        $privStmt->close();
    }

    echo json_encode(['success' => true, 'message' => 'Account updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
}

require_once 'log_activity.php';
$targetRow = $conn->query("SELECT username, account_status FROM users WHERE user_ID = '$userId'")->fetch_assoc();
logActivity($conn, $userId, $targetRow['username'] ?? $userId, $accountStatus,
    'Account Updated',
    "Account details updated",
    $_SESSION['username'] ?? 'system'
);

$stmt->close();
$conn->close();
?>