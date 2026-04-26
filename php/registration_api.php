<?php
session_start();
header('Content-Type: application/json');

// Verify Super Admin access
if (!isset($_SESSION['account_status']) || $_SESSION['account_status'] !== 'super admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Super Admin only.']);
    exit();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "fashionflow";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_pending_registrations':
        getPendingRegistrations($conn);
        break;
        
    case 'approve_registration':
        approveRegistration($conn);
        break;
        
    case 'reject_registration':
        rejectRegistration($conn);
        break;
        
    case 'get_registration_stats':
        getRegistrationStats($conn);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
        break;
}

$conn->close();

function getPendingRegistrations($conn) {
    $status = $_GET['status'] ?? 'pending';
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $offset = ($page - 1) * $limit;
    
    // FIXED: Changed 'users' to 'user'
    $whereClause = "WHERE account_status = 'user' AND approval_status = ?";
    if ($status === 'all') {
        $whereClause = "WHERE account_status = 'user' AND approval_status IN ('pending', 'approved', 'rejected')";
    }
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM users $whereClause";
    $countStmt = $conn->prepare($countSql);
    if ($status !== 'all') {
        $countStmt->bind_param("s", $status);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    $countStmt->close();
    
    // Get records
    $sql = "SELECT user_ID, username, email, Fname, M_I, Lname, Extension, 
                   birthdate, sex, purok, barangay, City_Municipality, 
                   province, country, zip_code, approval_status, approved_by, 
                   approved_at, rejection_reason, registered_at
            FROM users
            $whereClause
            ORDER BY registered_at DESC
            LIMIT ? OFFSET ?";
            
    $stmt = $conn->prepare($sql);
    if ($status !== 'all') {
        $stmt->bind_param("sii", $status, $limit, $offset);
    } else {
        $stmt->bind_param("ii", $limit, $offset);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $registrations = [];
    while ($row = $result->fetch_assoc()) {
        $full_name = trim($row['Fname'] . ' ' . $row['M_I'] . ' ' . $row['Lname'] . ' ' . $row['Extension']);
        $address = trim($row['purok'] . ', ' . $row['barangay'] . ', ' . $row['City_Municipality'] . ', ' . $row['province'] . ', ' . $row['country'] . ' ' . $row['zip_code']);
        
        $registrations[] = [
            'user_id' => $row['user_ID'],
            'username' => $row['username'],
            'email' => $row['email'],
            'full_name' => $full_name,
            'approval_status' => $row['approval_status'],
            'registered_at' => $row['registered_at'],
            'approved_at' => $row['approved_at'],
            'approved_by' => $row['approved_by'],
            'rejection_reason' => $row['rejection_reason'],
            'details' => [
                'birthdate' => $row['birthdate'],
                'sex' => $row['sex'],
                'address' => $address
            ]
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'registrations' => $registrations,
            'pagination' => [
                'current_page' => intval($page),
                'total_pages' => ceil($total / $limit),
                'total_records' => intval($total),
                'per_page' => intval($limit)
            ]
        ]
    ]);
}

function approveRegistration($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? '';
    $adminUsername = $_SESSION['username'] ?? 'Unknown';
    
    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required.']);
        return;
    }
    
    // FIXED: Changed 'users' to 'user'
    $stmt = $conn->prepare("UPDATE users SET approval_status = 'approved', approved_by = ?, approved_at = NOW() WHERE user_ID = ? AND account_status = 'user' AND approval_status = 'pending'");
    $stmt->bind_param("ss", $adminUsername, $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found or already processed.']);
        $stmt->close();
        return;
    }
    $stmt->close();
    
    // Insert audit record
    $stmt = $conn->prepare("INSERT INTO registration_requests (user_id, username, email, full_name, approval_status, processed_at, processed_by) 
                           SELECT user_ID, username, email, CONCAT(Fname, ' ', Lname), 'approved', NOW(), ? 
                           FROM users WHERE user_ID = ? 
                           ON DUPLICATE KEY UPDATE approval_status = 'approved', processed_at = NOW(), processed_by = ?");
    $stmt->bind_param("sss", $adminUsername, $userId, $adminUsername);
    $stmt->execute();
    $stmt->close();
    
    echo json_encode([
        'success' => true, 
        'message' => 'User registration approved successfully.',
        'approved_by' => $adminUsername,
        'approved_at' => date('Y-m-d H:i:s')
    ]);
}

function rejectRegistration($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? '';
    $reason = $data['reason'] ?? 'No reason provided';
    $adminUsername = $_SESSION['username'] ?? 'Unknown';
    
    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required.']);
        return;
    }
    
    // FIXED: Changed 'users' to 'user'
    $stmt = $conn->prepare("UPDATE users SET approval_status = 'rejected', rejection_reason = ? WHERE user_ID = ? AND account_status = 'user' AND approval_status = 'pending'");
    $stmt->bind_param("ss", $reason, $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found or already processed.']);
        $stmt->close();
        return;
    }
    $stmt->close();
    
    // Insert audit record
    $stmt = $conn->prepare("INSERT INTO registration_requests (user_id, username, email, full_name, approval_status, processed_at, processed_by, rejection_reason) 
                           SELECT user_ID, username, email, CONCAT(Fname, ' ', Lname), 'rejected', NOW(), ?, ? 
                           FROM users WHERE user_ID = ? 
                           ON DUPLICATE KEY UPDATE approval_status = 'rejected', processed_at = NOW(), processed_by = ?, rejection_reason = ?");
    $stmt->bind_param("sssss", $adminUsername, $reason, $userId, $adminUsername, $reason);
    $stmt->execute();
    $stmt->close();
    
    echo json_encode([
        'success' => true, 
        'message' => 'User registration rejected.',
        'rejected_by' => $adminUsername,
        'rejected_at' => date('Y-m-d H:i:s'),
        'reason' => $reason
    ]);
}

function getRegistrationStats($conn) {
    $stats = [];
    
    // Note: These already use 'user' (singular) — no change needed
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE account_status = 'user' AND approval_status = 'pending'");
    $stats['pending'] = $result->fetch_assoc()['count'];
    
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE account_status = 'user' AND approval_status = 'approved' AND DATE(approved_at) = CURDATE()");
    $stats['approved_today'] = $result->fetch_assoc()['count'];
    
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE account_status = 'user' AND approval_status = 'rejected' AND approved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $stats['rejected_this_week'] = $result->fetch_assoc()['count'];
    
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE account_status = 'user' AND registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
    $stats['total_this_month'] = $result->fetch_assoc()['count'];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}
?>