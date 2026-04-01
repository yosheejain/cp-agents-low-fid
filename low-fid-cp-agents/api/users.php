<?php
require_once __DIR__ . '/config.php';

$body        = requestBody();
$action      = $body['action'] ?? '';
$adminPw     = $body['admin_password'] ?? '';

// All endpoints here require the admin password
if ($adminPw !== ADMIN_PASSWORD) {
    jsonResponse(['error' => 'Admin password incorrect.'], 401);
}

$db = getDB();

// ── List users ────────────────────────────────────────────────────────────────
if ($action === 'list') {
    $stmt = $db->query(
        'SELECT id, username, is_admin, group_id, created_at
         FROM users
         ORDER BY created_at DESC'
    );
    jsonResponse(['users' => $stmt->fetchAll()]);
}

// ── Create user ───────────────────────────────────────────────────────────────
if ($action === 'create') {
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';
    $isAdmin  = !empty($body['is_admin']) ? 1 : 0;
    $groupId  = in_array((int)($body['group_id'] ?? 1), [1, 2]) ? (int)$body['group_id'] : 1;

    if (!$username || !$password) {
        jsonResponse(['error' => 'Username and password are required.'], 400);
    }
    if (strlen($username) < 2 || strlen($username) > 64) {
        jsonResponse(['error' => 'Username must be 2–64 characters.'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Password must be at least 6 characters.'], 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    try {
        $stmt = $db->prepare(
            'INSERT INTO users (username, password_hash, is_admin, group_id) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$username, $hash, $isAdmin, $groupId]);
        jsonResponse(['success' => true, 'id' => (int) $db->lastInsertId()]);
    } catch (PDOException $e) {
        if ((string) $e->getCode() === '23000') {
            jsonResponse(['error' => 'Username already exists.'], 409);
        }
        throw $e;
    }
}

// ── Delete user ───────────────────────────────────────────────────────────────
if ($action === 'delete') {
    $id = (int) ($body['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'User ID required.'], 400);
    }
    // Cascade deletes tokens + conversations + messages via FK
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Unknown action.'], 400);
