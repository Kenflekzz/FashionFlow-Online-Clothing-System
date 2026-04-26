<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['account_status']) || $_SESSION['account_status'] !== 'user') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if (!isset($_FILES['profile_pic']) || !isset($_POST['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$userId = $_POST['user_id'];

// Verify session matches the user being updated
if ($userId != $_SESSION['user_id']) {
    echo json_encode(['success' => false, 'message' => 'You can only update your own profile picture']);
    exit;
}

$file = $_FILES['profile_pic'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Only JPG, JPEG, PNG files are allowed']);
    exit;
}

// Validate file size (max 2MB)
if ($file['size'] > 2 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'File size must be less than 2MB']);
    exit;
}

// Create uploads directory if not exists
$uploadDir = '../uploads/profile_pics/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'profile_' . $userId . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE users SET profile_pic = ? WHERE user_ID = ?");
    $stmt->bind_param("ss", $filepath, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Profile picture updated', 'image_url' => $filepath]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update database']);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
}
?>