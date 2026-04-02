<?php
require_once __DIR__ . '/config.php';

$user   = requireAuth();
$db     = getDB();
$action = $_GET['action'] ?? '';

// ── List conversations ────────────────────────────────────────────────────────
if ($action === 'list') {
    $role  = $_GET['role']  ?? '';
    $topic = $_GET['topic'] ?? '';

    $sql    = '
        SELECT
            c.id, c.role, c.user_role, c.topic, c.started_at, c.ended_at,
            u.username,
            (
                SELECT COUNT(*) FROM messages m
                WHERE m.conversation_id = c.id AND m.role != "system"
            ) AS message_count,
            (
                SELECT content FROM messages m
                WHERE m.conversation_id = c.id AND m.role = "user"
                ORDER BY m.created_at ASC
                LIMIT 1
            ) AS first_message,
            (
                SELECT SUM(tokens_used) FROM messages m
                WHERE m.conversation_id = c.id
            ) AS total_tokens
        FROM conversations c
        JOIN users u ON c.user_id = u.id
        WHERE 1=1
    ';
    $params = [];

    if ($role)  { $sql .= ' AND c.role  = ?'; $params[] = $role; }
    if ($topic) { $sql .= ' AND c.topic = ?'; $params[] = $topic; }

    // Only show conversations with at least one real message
    $sql .= ' AND (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.role IN ("user","assistant")) > 0';
    // Only show conversations from users in the same group as the logged-in user
    $sql .= ' AND u.group_id = (SELECT group_id FROM users WHERE id = ?)';
    $params[] = $user['id'];
    $sql .= ' ORDER BY c.started_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['conversations' => $stmt->fetchAll()]);
}

// ── Get single conversation with messages ─────────────────────────────────────
if ($action === 'get') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'id parameter required.'], 400);
    }

    $stmt = $db->prepare(
        'SELECT c.id, c.role, c.user_role, c.topic, c.started_at, c.ended_at, u.username
         FROM conversations c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?
         LIMIT 1'
    );
    $stmt->execute([$id]);
    $conv = $stmt->fetch();

    if (!$conv) {
        jsonResponse(['error' => 'Conversation not found.'], 404);
    }

    // Fetch messages excluding system prompt
    $stmt = $db->prepare(
        'SELECT id, role, content, created_at, tokens_used
         FROM messages
         WHERE conversation_id = ? AND role != "system"
         ORDER BY created_at ASC'
    );
    $stmt->execute([$id]);
    $messages = $stmt->fetchAll();

    jsonResponse(['conversation' => $conv, 'messages' => $messages]);
}

jsonResponse(['error' => 'Unknown action.'], 400);
