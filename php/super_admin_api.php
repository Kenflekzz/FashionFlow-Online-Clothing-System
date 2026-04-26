<?php
// Disable error reporting for JSON output
error_reporting(0);
ini_set('display_errors', 0);

// Set JSON header immediately
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Create uploads directory if it doesn't exist
$uploadDir = '../uploads/deletion_proofs/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'fashionflow');

// Response helper
function respond($success, $data = null, $message = '') {
    $response = [
        'success' => $success,
        'data'    => $data,
        'message' => $message
    ];
    echo json_encode($response);
    exit;
}

// Database connection
function getDB() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        respond(false, null, 'Database connection failed');
    }
}

// Enhanced log activity function
function logActivity($db, $userId, $username, $role, $type, $description, $performedBy, $ipAddress = null, $device = null) {
    try {
        // Get IP address if not provided
        if (!$ipAddress) {
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            if ($ipAddress === '::1') $ipAddress = '127.0.0.1';
        }
        
        // Get device info if not provided
        if (!$device) {
            $device = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
            // Simplify device info
            if (strpos($device, 'Mobile') !== false) $device = 'Mobile';
            elseif (strpos($device, 'Tablet') !== false) $device = 'Tablet';
            else $device = 'Desktop';
        }
        
        $stmt = $db->prepare("
            INSERT INTO activity_log (user_id, username, role, activity_type, description, ip_address, device, performed_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $username, $role, $type, $description, $ipAddress, $device, $performedBy]);
        return true;
    } catch (Exception $e) {
        // Silently fail - don't break the main operation
        error_log("Failed to log activity: " . $e->getMessage());
        return false;
    }
}

// Helper to get current user info
function getCurrentUser() {
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? 'System',
        'role' => $_SESSION['account_status'] ?? 'super admin'
    ];
}

// Helper to get full name
function getFullName($user) {
    $name = $user['Fname'] ?? '';
    if (!empty($user['M_I'])) {
        $name .= ' ' . $user['M_I'] . '.';
    }
    $name .= ' ' . ($user['Lname'] ?? '');
    if (!empty($user['Extension'])) {
        $name .= ' ' . $user['Extension'];
    }
    return trim($name);
}

// Helper function to parse full name into parts
function parseName($fullName) {
    $parts  = explode(' ', trim($fullName));
    $count  = count($parts);
    $result = ['fname' => $parts[0] ?? '', 'mi' => '', 'lname' => ''];

    if ($count == 2) {
        $result['lname'] = $parts[1];
    } elseif ($count == 3) {
        if (strlen(preg_replace('/[^a-zA-Z]/', '', $parts[1])) <= 2) {
            $result['mi']    = str_replace('.', '', $parts[1]);
            $result['lname'] = $parts[2];
        } else {
            $result['lname'] = $parts[1] . ' ' . $parts[2];
        }
    } elseif ($count >= 4) {
        $result['mi']    = str_replace('.', '', $parts[1]);
        $result['lname'] = $parts[$count - 2] . ' ' . $parts[$count - 1];
    }

    return $result;
}

// ============================================
// SUPER ADMIN MANAGEMENT FUNCTIONS
// ============================================

// Check super admin count
function getSuperAdminCount($db) {
    $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE account_status = 'super admin' AND (is_deleted = 0 OR is_deleted IS NULL)");
    $result = $stmt->fetch();
    return $result['count'];
}

function getOldestSuperAdmin($db) {
    $stmt = $db->query("
        SELECT user_ID, username, Fname, Lname, registered_at 
        FROM users 
        WHERE account_status = 'super admin' 
        AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY registered_at ASC 
        LIMIT 1
    ");
    return $stmt->fetch();
}

// ============================================
// SUPER ADMIN MANAGEMENT FUNCTIONS
// ============================================

// Get the most recently active super admin
function getMostRecentActiveSuperAdmin($db) {
    $stmt = $db->query("
        SELECT user_ID, username, Fname, Lname, last_active 
        FROM users 
        WHERE account_status = 'super admin' 
        AND is_blocked = 0
        AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY last_active DESC, registered_at DESC
        LIMIT 1
    ");
    return $stmt->fetch();
}

// Get all active super admins except the current one
function getOtherActiveSuperAdmins($db, $currentUserId) {
    $stmt = $db->prepare("
        SELECT user_ID, username, last_active 
        FROM users 
        WHERE account_status = 'super admin' 
        AND is_blocked = 0
        AND user_ID != ?
        AND (is_deleted = 0 OR is_deleted IS NULL)
        ORDER BY last_active DESC
    ");
    $stmt->execute([$currentUserId]);
    return $stmt->fetchAll();
}

// Block all other super admins except the specified one
function blockOtherSuperAdmins($db, $keepUserId, $blockedBy, $reason = 'Auto-blocked: Newer super admin activity detected') {
    $stmt = $db->prepare("
        UPDATE users 
        SET is_blocked = 1, 
            block_reason = ?,
            blocked_by = ?, 
            blocked_at = NOW() 
        WHERE account_status = 'super admin' 
        AND is_blocked = 0
        AND user_ID != ?
    ");
    $stmt->execute([$reason, $blockedBy, $keepUserId]);
    
    // Get affected users for logging
    $affectedStmt = $db->prepare("
        SELECT username FROM users 
        WHERE account_status = 'super admin' 
        AND is_blocked = 1
        AND blocked_at = NOW()
        AND user_ID != ?
    ");
    $affectedStmt->execute([$keepUserId]);
    $affectedUsers = $affectedStmt->fetchAll();
    
    foreach ($affectedUsers as $user) {
        logActivity(
            $db,
            $keepUserId,
            $user['username'],
            'super admin',
            'Account Blocked',
            $reason,
            $blockedBy
        );
    }
    
    return count($affectedUsers);
}

// Update last_active timestamp
function updateLastActive($db, $userId) {
    $stmt = $db->prepare("UPDATE users SET last_active = NOW() WHERE user_ID = ?");
    $stmt->execute([$userId]);
}

// ============================================
// MAIN ROUTING
// ============================================
$method = $_SERVER['REQUEST_METHOD'];

// Handle both JSON and FormData/multipart
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
} else {
    $input = $_POST;
}

$action = $_GET['action'] ?? $input['action'] ?? '';
$currentUser = getCurrentUser();

try {
    $db = getDB();

    switch ($action) {

        case 'get_admins':
            $stmt = $db->query("
                SELECT user_ID, Fname, M_I, Lname, Extension, username, email,
                       account_status, last_login, last_logout, birthdate, sex,
                       purok, barangay, City_Municipality, province, country, zip_code,
                       is_blocked, block_reason, blocked_by, blocked_at,
                       registered_at
                FROM users
                WHERE account_status IN ('admin', 'super admin')
                ORDER BY user_ID DESC
            ");
            $users = $stmt->fetchAll();

            $admins = [];
            foreach ($users as $user) {
                $privStmt = $db->prepare("
                    SELECT module, can_create, can_read, can_update, can_delete, can_block
                    FROM user_privileges
                    WHERE user_id = ?
                ");
                $privStmt->execute([$user['user_ID']]);
                $privRows = $privStmt->fetchAll();

                $privileges = [];
                foreach ($privRows as $p) {
                    $actions = [];
                    if ($p['can_create']) $actions[] = 'create';
                    if ($p['can_read'])   $actions[] = 'read';
                    if ($p['can_update']) $actions[] = 'update';
                    if ($p['can_delete']) $actions[] = 'delete';
                    if ($p['can_block'])  $actions[] = 'block';
                    $privileges[$p['module']] = $actions;
                }

                $admins[] = [
                    'id'                => $user['user_ID'],
                    'full_name'         => getFullName($user),
                    'name'              => getFullName($user),
                    'username'          => $user['username'],
                    'email'             => $user['email'],
                    'status'            => $user['is_blocked'] ? 'Blocked' : 'Active',
                    'lastLogin'         => $user['last_login'] ?? 'Never',
                    'created'           => $user['registered_at'] ?? null,
                    'Fname'             => $user['Fname'],
                    'M_I'               => $user['M_I'],
                    'Lname'             => $user['Lname'],
                    'Extension'         => $user['Extension'],
                    'birthdate'         => $user['birthdate'],
                    'sex'               => $user['sex'],
                    'purok'             => $user['purok'],
                    'barangay'          => $user['barangay'],
                    'City_Municipality' => $user['City_Municipality'],
                    'province'          => $user['province'],
                    'country'           => $user['country'] ?: 'Philippines',
                    'zip_code'          => $user['zip_code'],
                    'account_status'    => $user['account_status'],
                    'is_blocked'        => (bool)$user['is_blocked'],
                    'block_reason'      => $user['block_reason'],
                    'blocked_by'        => $user['blocked_by'],
                    'blocked_at'        => $user['blocked_at'],
                    'last_login'        => $user['last_login'],
                    'last_logout'       => $user['last_logout'],
                    'registered_at'     => $user['registered_at'],
                    'privileges'        => $privileges,
                ];
            }

            respond(true, ['admins' => $admins]);
            break;

       case 'create_admin':
    $errors = [];

    if (empty($input['name']))     $errors[] = 'Name is required';
    if (empty($input['username'])) $errors[] = 'Username is required';
    if (empty($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL))
        $errors[] = 'Valid email is required';
    if (empty($input['password']) || strlen($input['password']) < 8)
        $errors[] = 'Password must be at least 8 characters';

    if (!empty($errors)) respond(false, null, implode(', ', $errors));

    $stmt = $db->prepare("SELECT user_ID FROM users WHERE username = ?");
    $stmt->execute([$input['username']]);
    if ($stmt->fetch()) respond(false, null, 'Username already exists');

    $stmt = $db->prepare("SELECT user_ID FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    if ($stmt->fetch()) respond(false, null, 'Email already exists');

    // Get the role from input
    $role = $input['account_status'] ?? 'user';
    
    // Check super admin limit
    if ($role === 'super admin') {
        $superAdminCount = getSuperAdminCount($db);
        
        if ($superAdminCount >= 2) {
            respond(false, null, 'Cannot create more than 2 Super Admin accounts. Maximum limit reached.');
        }
    }

    $nameParts = parseName($input['name']);
    
    // Generate user ID based on role
    if ($role === 'super admin') {
        $userId = 'SUP' . date('Y') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    } elseif ($role === 'admin') {
        $userId = 'ADM' . date('Y') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    } else {
        $userId = 'USR' . date('Y') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    $stmt = $db->prepare("
        INSERT INTO users (
            user_ID, Fname, M_I, Lname, username, email,
            password, account_status, sex, birthdate,
            sec_question_1, sec_answer_1,
            sec_question_2, sec_answer_2,
            sec_question_3, sec_answer_3, last_active
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, 'Male', '2000-01-01',
            'What is your favorite color?', ?,
            'What is your pet name?', ?,
            'What city were you born in?', ?, NOW()
        )
    ");

    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
    $dummyAnswer    = password_hash('answer', PASSWORD_DEFAULT);

    $stmt->execute([
        $userId,
        $nameParts['fname'],
        $nameParts['mi'],
        $nameParts['lname'],
        $input['username'],
        $input['email'],
        $hashedPassword,
        $role,
        $dummyAnswer,
        $dummyAnswer,
        $dummyAnswer
    ]);

    // If this is a super admin, block any other active super admins
    if ($role === 'super admin') {
        $blockedCount = blockOtherSuperAdmins($db, $userId, $currentUser['username'], 
            'Auto-blocked: New super admin account created. Only one active super admin allowed.');
        
        if ($blockedCount > 0) {
            // Log the auto-block action
            logActivity(
                $db,
                $currentUser['id'],
                $currentUser['username'],
                $currentUser['role'],
                'Account Created',
                "Created new super admin account: {$input['username']}. Blocked {$blockedCount} other super admin account(s).",
                $currentUser['username']
            );
        }
    }

    // Log activity
    logActivity(
        $db,
        $currentUser['id'],
        $currentUser['username'],
        $currentUser['role'],
        'Account Created',
        "Created new {$role} account: {$input['username']} ({$input['name']})",
        $currentUser['username']
    );

    $message = ($role === 'super admin') ? 
        'Super Admin account created successfully. All other super admin accounts have been blocked.' : 
        'Account created successfully';
    
    respond(true, ['id' => $userId], $message);
    break;

    // Inside update_admin case, after updating the role
// Handle super admin promotion
if ($newRole === 'super admin' && $originalUser['account_status'] !== 'super admin') {
    // Block all other active super admins
    $blockedCount = blockOtherSuperAdmins($db, $input['id'], $currentUser['username'],
        'Auto-blocked: User promoted to super admin. Only one active super admin allowed.');
    
    // Update last_active for the new super admin
    updateLastActive($db, $input['id']);
    
    if ($transactionStarted) $db->commit();
} elseif ($transactionStarted) {
    $db->commit();
}

        case 'delete_admin':
        case 'delete_user':
            $id          = $_POST['id']           ?? '';
            $reason      = $_POST['reason']       ?? '';
            $requestedBy = $_POST['requested_by'] ?? '';
            $deletedBy   = $_POST['deleted_by']   ?? $currentUser['username'];

            if (empty($id))          respond(false, null, 'Account ID is required');
            if (empty($reason))      respond(false, null, 'Reason is required');
            if (empty($requestedBy)) respond(false, null, 'Requesting authority is required');

            if (!isset($_FILES['proof_file']) || $_FILES['proof_file']['error'] !== UPLOAD_ERR_OK) {
                respond(false, null, 'Authorization proof file is required');
            }

            $file         = $_FILES['proof_file'];
            $allowedTypes = [
                'image/jpeg', 'image/png', 'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!in_array($file['type'], $allowedTypes)) {
                respond(false, null, 'Invalid file type. Allowed: JPG, PNG, PDF, DOC, DOCX');
            }

            if ($file['size'] > 5 * 1024 * 1024) {
                respond(false, null, 'File size exceeds 5MB limit');
            }

            $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'deletion_proof_' . $id . '_' . time() . '.' . $ext;
            $filepath = $uploadDir . $filename;

            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                respond(false, null, 'Failed to save uploaded file');
            }

            // Fetch user info before deleting
            $delUser = $db->prepare("SELECT * FROM users WHERE user_ID = ?");
            $delUser->execute([$id]);
            $delRow = $delUser->fetch();

            if (!$delRow) {
                respond(false, null, 'Account not found');
            }

            // Insert into deleted_accounts_log table
            $logStmt = $db->prepare("
                INSERT INTO deleted_accounts_log 
                    (deleted_user_id, username, email, full_name, role, 
                     deleted_by, reason, requested_by, proof_file, deleted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $fullName = trim(($delRow['Fname'] ?? '') . ' ' . ($delRow['Lname'] ?? ''));
            $logStmt->execute([
                $id,
                $delRow['username'],
                $delRow['email'],
                $fullName ?: $delRow['username'],
                $delRow['account_status'] ?? ($action === 'delete_admin' ? 'admin' : 'user'),
                $deletedBy,
                $reason,
                $requestedBy,
                $filename
            ]);

            // Log deletion activity
            logActivity(
                $db,
                $currentUser['id'],
                $currentUser['username'],
                $currentUser['role'],
                'Account Deleted',
                "Deleted account: {$delRow['username']} (Role: {$delRow['account_status']}). Reason: {$reason}. Requested by: {$requestedBy}",
                $deletedBy
            );

            // HARD DELETE - Completely remove from all tables
            try {
                $db->beginTransaction();
                
                // Delete from user_privileges
                $privStmt = $db->prepare("DELETE FROM user_privileges WHERE user_id = ?");
                $privStmt->execute([$id]);
                
                // Delete from login_history (if table exists)
                try {
                    $loginStmt = $db->prepare("DELETE FROM login_history WHERE user_id = ?");
                    $loginStmt->execute([$id]);
                } catch (Exception $e) {
                    // Table might not exist, continue
                }
                
                // Delete from security_logs (if table exists)
                try {
                    $secStmt = $db->prepare("DELETE FROM security_logs WHERE user_id = ?");
                    $secStmt->execute([$id]);
                } catch (Exception $e) {
                    // Table might not exist, continue
                }
                
                // Delete from users table
                $stmt = $db->prepare("DELETE FROM users WHERE user_ID = ?");
                $stmt->execute([$id]);
                
                $db->commit();
                respond(true, null, 'Account permanently deleted from database');
            } catch (Exception $e) {
                $db->rollBack();
                respond(false, null, 'Error deleting account: ' . $e->getMessage());
            }
            break;

        case 'get_all_users':
            $stmt = $db->query("
                SELECT user_ID, Fname, M_I, Lname, Extension, username, email,
                       status, account_status, last_login, created_at,
                       is_blocked, block_reason, blocked_at
                FROM users
                ORDER BY user_ID DESC
            ");
            $users = $stmt->fetchAll();

            $allUsers = [];
            foreach ($users as $user) {
                $allUsers[] = [
                    'id'           => $user['user_ID'],
                    'user_id'      => $user['user_ID'],
                    'username'     => $user['username'],
                    'email'        => $user['email'],
                    'full_name'    => getFullName($user),
                    'first_name'   => $user['Fname'],
                    'last_name'    => $user['Lname'],
                    'role'         => $user['account_status'],
                    'status'       => $user['status'] ?? 'active',
                    'sex'          => $user['sex'] ?? '',
                    'birthdate'    => $user['birthdate'] ?? '',
                    'last_login'   => $user['last_login'] ?? '',
                    'created_at'   => $user['created_at'] ?? '',
                    'is_blocked'   => $user['is_blocked'] ?? 0,
                    'block_reason' => $user['block_reason'] ?? null,
                    'blocked_at'   => $user['blocked_at'] ?? null
                ];
            }

            respond(true, ['users' => $allUsers]);
            break;

        case 'get_deleted_accounts':
            // Check if table exists
            try {
                $tableCheck = $db->query("SHOW TABLES LIKE 'deleted_accounts_log'");
                if ($tableCheck->rowCount() == 0) {
                    respond(true, ['records' => []]);
                    break;
                }
                
                $stmt = $db->query("
                    SELECT 
                        log_id as id,
                        deleted_user_id,
                        username,
                        email,
                        full_name,
                        role,
                        deleted_by,
                        reason,
                        requested_by,
                        proof_file,
                        deleted_at
                    FROM deleted_accounts_log
                    ORDER BY deleted_at DESC
                ");
                $records = $stmt->fetchAll();
                respond(true, ['records' => $records]);
            } catch (Exception $e) {
                respond(true, ['records' => []]);
            }
            break;

        case 'get_super_admin_count':
            $count = getSuperAdminCount($db);
            respond(true, ['count' => $count], 'Super admin count retrieved');
            break;

        // ============================================
        // BLOCK/UNBLOCK USER ACTIONS WITH LOGGING
        // ============================================
        case 'block_user':
            $userId = $input['user_id'] ?? '';
            $reason = $input['reason'] ?? '';
            $blockedBy = $input['blocked_by'] ?? $currentUser['username'];
            
            if (empty($userId)) respond(false, null, 'User ID is required');
            if (empty($reason)) respond(false, null, 'Block reason is required');
            
            // Get user info
            $userStmt = $db->prepare("SELECT username, account_status FROM users WHERE user_ID = ?");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            
            if (!$user) respond(false, null, 'User not found');
            
            $stmt = $db->prepare("UPDATE users SET is_blocked = 1, block_reason = ?, blocked_by = ?, blocked_at = NOW() WHERE user_ID = ?");
            $stmt->execute([$reason, $blockedBy, $userId]);
            
            // Log activity
            logActivity(
                $db,
                $currentUser['id'],
                $currentUser['username'],
                $currentUser['role'],
                'Account Blocked',
                "Blocked user: {$user['username']} (Role: {$user['account_status']}). Reason: {$reason}",
                $blockedBy
            );
            
            respond(true, null, 'User blocked successfully');
            break;
            
        case 'unblock_user':
            $userId = $input['user_id'] ?? '';
            $reason = $input['reason'] ?? '';
            $unblockedBy = $input['unblocked_by'] ?? $currentUser['username'];
            
            if (empty($userId)) respond(false, null, 'User ID is required');
            
            // Get user info
            $userStmt = $db->prepare("SELECT username, account_status FROM users WHERE user_ID = ?");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            
            if (!$user) respond(false, null, 'User not found');
            
            $stmt = $db->prepare("UPDATE users SET is_blocked = 0, block_reason = NULL, blocked_by = NULL, blocked_at = NULL WHERE user_ID = ?");
            $stmt->execute([$userId]);
            
            // Log activity
            $description = "Unblocked user: {$user['username']} (Role: {$user['account_status']})";
            if (!empty($reason)) $description .= ". Reason: {$reason}";
            
            logActivity(
                $db,
                $currentUser['id'],
                $currentUser['username'],
                $currentUser['role'],
                'Account Unblocked',
                $description,
                $unblockedBy
            );
            
            respond(true, null, 'User unblocked successfully');
            break;

        default:
            respond(false, null, 'Invalid action: ' . $action);
            break;
    }

} catch (Exception $e) {
    respond(false, null, 'Error: ' . $e->getMessage());
}
?>