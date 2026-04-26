<?php
session_start();
header('Content-Type: application/json');

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

ob_start();

require_once 'check_privileges.php';

$response = ['status' => 200, 'customers' => [], 'total' => 0, 'page' => 1, 'pages' => 1, 'stats' => []];
$httpCode = 200;

try {
    $conn = new mysqli("localhost", "root", "", "fashionflow");
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }

    // Check read permission
    if (!checkPrivilegeSilent('users', 'read', $conn)) {
        http_response_code(403);
        $response = ['status' => 403, 'message' => 'No permission to view accounts'];
        $conn->close();
        ob_end_clean();
        echo json_encode($response);
        exit;
    }

    // Pagination parameters
    $page   = isset($_GET['page'])  ? max(1, intval($_GET['page']))            : 1;
    $limit  = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 10;
    $offset = ($page - 1) * $limit;

    // Filters
    $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
    $status = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : 'all';
    $sort   = isset($_GET['sort'])   ? $conn->real_escape_string($_GET['sort'])   : 'newest';

    // Build WHERE clause — all roles, excluding deleted
    $where = "WHERE (u.is_deleted = 0 OR u.is_deleted IS NULL)
          AND u.account_status IN ('user', 'admin')";
    if (!empty($search)) {
        $where .= " AND (u.username LIKE '%{$search}%'
                        OR u.email  LIKE '%{$search}%'
                        OR CONCAT(u.Fname, ' ', u.Lname) LIKE '%{$search}%')";
    }
    if ($status !== 'all') {
        $where .= " AND u.status = '{$status}'";
    }

    // Get total count
    $countQuery  = "SELECT COUNT(*) as total FROM users u {$where}";
    $countResult = $conn->query($countQuery);
    if (!$countResult) {
        throw new Exception('Count query failed: ' . $conn->error);
    }
    $total = $countResult->fetch_assoc()['total'];

    // Sorting
    $orderBy = "ORDER BY u.registered_at DESC";
    switch ($sort) {
        case 'oldest':    $orderBy = "ORDER BY u.registered_at ASC"; break;
        case 'name_asc':  $orderBy = "ORDER BY u.Fname ASC";         break;
        case 'name_desc': $orderBy = "ORDER BY u.Fname DESC";        break;
    }

    // Main query
    $query = "
        SELECT
            u.user_ID,
            u.username,
            u.email,
            TRIM(CONCAT(
                COALESCE(u.Fname, ''),      ' ',
                COALESCE(u.M_I, ''),        ' ',
                COALESCE(u.Lname, ''),      ' ',
                COALESCE(u.Extension, '')
            )) AS full_name,
            u.account_status AS role,
            u.status,
            u.is_blocked,
            u.registered_at
        FROM users u
        {$where}
        {$orderBy}
        LIMIT {$limit} OFFSET {$offset}
    ";

    $result = $conn->query($query);
    if (!$result) {
        throw new Exception('Main query failed: ' . $conn->error);
    }

    $customers = [];
    while ($row = $result->fetch_assoc()) {
        $full_name  = preg_replace('/\s+/', ' ', trim($row['full_name']));
        $is_blocked = intval($row['is_blocked'] ?? 0);

        $customers[] = [
            'id'         => $row['user_ID'],
            'username'   => $row['username']      ?? '',
            'email'      => $row['email']         ?? '',
            'full_name'  => $full_name,
            'role'       => $row['role']          ?? 'user',
            'status'     => $is_blocked ? 'Suspended' : ($row['status'] ?? 'Active'),
            'is_blocked' => $is_blocked,
            'created_at' => $row['registered_at'] ?? ''
        ];
    }

    // Get statistics
    $statsQuery = "
        SELECT
            COUNT(*)                                                                                    AS total,
            SUM(CASE WHEN status = 'Active' AND (is_blocked = 0 OR is_blocked IS NULL) THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN account_status = 'admin'                                     THEN 1 ELSE 0 END) AS admins,
            SUM(CASE WHEN is_blocked = 1                                               THEN 1 ELSE 0 END) AS suspended,
            SUM(CASE WHEN DATE(last_login) = CURDATE()                                 THEN 1 ELSE 0 END) AS active_today
        FROM users
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
        AND account_status IN ('user', 'admin')
    ";
    $statsResult = $conn->query($statsQuery);
    if (!$statsResult) {
        throw new Exception('Stats query failed: ' . $conn->error);
    }
    $stats = $statsResult->fetch_assoc();

    $response = [
        'status'    => 200,
        'customers' => $customers,
        'total'     => intval($total),
        'page'      => $page,
        'pages'     => max(1, ceil($total / $limit)),
        'stats'     => [
            'total'        => intval($stats['total']        ?? 0),
            'active'       => intval($stats['active']       ?? 0),
            'admins'       => intval($stats['admins']       ?? 0),
            'blocked'      => intval($stats['suspended']    ?? 0),
            'active_today' => intval($stats['active_today'] ?? 0),
        ]
    ];

    $conn->close();

} catch (Exception $e) {
    $httpCode = 500;
    $response = [
        'status'  => 500,
        'message' => 'Server error: ' . $e->getMessage()
    ];
    error_log('Customer API Error: ' . $e->getMessage());
}

ob_end_clean();
http_response_code($httpCode);
echo json_encode($response);
exit;
?>