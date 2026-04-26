<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 401, 'message' => 'Not authenticated']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "fashionflow");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 500, 'message' => 'Database connection failed']);
    exit;
}

$query = "
    SELECT 
        user_ID,
        username,
        email,
        Fname,
        M_I,
        Lname,
        Extension,
        birthdate,
        sex,
        purok,
        barangay,
        City_Municipality,
        province,
        country,
        zip_code,
        account_status,
        status,
        is_blocked,
        blocked_at,
        blocked_by,
        block_reason,
        last_login,
        last_logout,
        registered_at,
        created_at,
        approved_at
    FROM users
    WHERE account_status IN ('admin', 'super admin')
    AND (is_deleted = 0 OR is_deleted IS NULL)
    ORDER BY registered_at DESC
";

$result = $conn->query($query);
$admins = [];

while ($row = $result->fetch_assoc()) {

    // Full name
    $fullName = trim(
        $row['Fname'] . ' ' .
        ($row['M_I'] ? $row['M_I'] . ' ' : '') .
        $row['Lname'] .
        ($row['Extension'] ? ' ' . $row['Extension'] : '')
    );

    // Privileges
    $privStmt = $conn->prepare("
        SELECT module, can_create, can_read, can_update, can_delete, can_block
        FROM user_privileges
        WHERE user_id = ?
    ");
    $privStmt->bind_param("i", $row['user_ID']);
    $privStmt->execute();
    $privResult = $privStmt->get_result();

    $privileges = [];
    while ($p = $privResult->fetch_assoc()) {
        $actions = [];
        if ($p['can_create']) $actions[] = 'create';
        if ($p['can_read'])   $actions[] = 'read';
        if ($p['can_update']) $actions[] = 'update';
        if ($p['can_delete']) $actions[] = 'delete';
        if ($p['can_block'])  $actions[] = 'block';

        $privileges[$p['module']] = $actions;
    }
    $privStmt->close();

    $admins[] = [
        'id' => (int)$row['user_ID'],
        'username' => $row['username'],
        'email' => $row['email'],
        'full_name' => $fullName,

        'name' => [
            'first' => $row['Fname'],
            'middle_initial' => $row['M_I'],
            'last' => $row['Lname'],
            'extension' => $row['Extension']
        ],

        'birthdate' => $row['birthdate'],
        'sex' => $row['sex'],

        'address' => [
            'purok' => $row['purok'],
            'barangay' => $row['barangay'],
            'city' => $row['City_Municipality'],
            'province' => $row['province'],
            'country' => $row['country'] ?: 'Philippines',
            'zip' => $row['zip_code']
        ],

        'account' => [
            'role' => $row['account_status'],
            'status' => $row['status'] ?: 'Active',
            'is_blocked' => (bool)$row['is_blocked']
        ],

        'block' => [
            'reason' => $row['block_reason'],
            'by' => $row['blocked_by'],
            'at' => $row['blocked_at']
        ],

        'system' => [
            'created_at' => $row['approved_at'] ?? $row['created_at'] ?? $row['registered_at'],
            'last_login' => $row['last_login'],
            'last_logout' => $row['last_logout']
        ],

        'privileges' => $privileges
    ];
}

$conn->close();

echo json_encode([
    'status' => 200,
    'admins' => $admins
]);