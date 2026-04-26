<?php
session_start();
header('Content-Type: application/json');

// Connect to DB
$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection error']);
    exit;
}

// Parse JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Required fields
$required = ['name', 'username', 'email', 'password'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Map input
$fullName = trim($input['name']);
$nameParts = explode(' ', $fullName);
$Fname = $nameParts[0];
$Lname = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

$username = $input['username'];
$email = $input['email'];
$password = password_hash($input['password'], PASSWORD_BCRYPT);

// Generate unique ID
$user_ID = uniqid('ADM_');

// Insert into users table
$stmt = $conn->prepare("
    INSERT INTO users (user_ID, Fname, Lname, username, email, password, account_status, status)
    VALUES (?, ?, ?, ?, ?, ?, 'admin', 'Active')
");
$stmt->bind_param("ssssss", $user_ID, $Fname, $Lname, $username, $email, $password);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Admin creation failed: ' . $stmt->error]);
    exit;
}

// Log the action (optional: use current super admin ID if available)
$admin_ID = $_SESSION['user_ID'] ?? 'SYSTEM';
$log = $conn->prepare("
    INSERT INTO security_logs (user_ID, action, status)
    VALUES (?, 'Created new admin account: $username', 'success')
");
$log->bind_param("s", $admin_ID);
$log->execute();

echo json_encode(['success' => true, 'message' => 'Admin created successfully']);
?>
