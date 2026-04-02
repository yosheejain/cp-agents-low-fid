<?php
require_once __DIR__ . '/config.php';

$user   = requireAuth();
$db     = getDB();
$body   = requestBody();
$action = $body['action'] ?? '';

// ── Create conversation ───────────────────────────────────────────────────────
if ($action === 'create_conversation') {
    $role     = trim($body['role']      ?? '');
    $topic    = trim($body['topic']     ?? '');
    $userRole = trim($body['user_role'] ?? '');

    if (!$role || !$topic) {
        jsonResponse(['error' => 'Role and topic are required.'], 400);
    }

    // Insert conversation row
    $stmt = $db->prepare(
        'INSERT INTO conversations (user_id, role, topic, user_role) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$user['id'], $role, $topic, $userRole ?: null]);
    $convId = (int) $db->lastInsertId();

    // Build system prompt from base file; substitute placeholders
    $promptTemplate = file_exists(PROMPT_FILE)
        ? file_get_contents(PROMPT_FILE)
        : 'You are a helpful AI assistant.';

    $systemPrompt = str_replace(
        ['{role}', '{topic}', '{username}', '{user_role}'],
        [$role, $topic, $user['username'], $userRole ?: 'general user'],
        $promptTemplate
    );

    // Append role-specific prompt if one exists for this role
    $rolePromptFile = dirname(PROMPT_FILE) . '/roles/' . preg_replace('/[^a-z0-9_]/', '', strtolower($role)) . '.txt';
    if (file_exists($rolePromptFile)) {
        $systemPrompt .= "\n\n" . trim(file_get_contents($rolePromptFile));
    }

    // Log system message (not shown to user in UI but included in API calls)
    $db->prepare(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, "system", ?)'
    )->execute([$convId, $systemPrompt]);

    // Seed opening messages from files
    $openingMessage = file_exists(OPENING_MESSAGE_FILE)
        ? trim(file_get_contents(OPENING_MESSAGE_FILE))
        : '';
    if ($openingMessage) {
        $db->prepare(
            'INSERT INTO messages (conversation_id, role, content) VALUES (?, "assistant", ?)'
        )->execute([$convId, $openingMessage]);
    }

    $openingMessage2 = file_exists(OPENING_MESSAGE_2_FILE)
        ? trim(file_get_contents(OPENING_MESSAGE_2_FILE))
        : '';
    if ($openingMessage2) {
        $db->prepare(
            'INSERT INTO messages (conversation_id, role, content) VALUES (?, "assistant", ?)'
        )->execute([$convId, $openingMessage2]);
    }

    // Log this event
    $db->prepare(
        'INSERT INTO logs (user_id, conversation_id, event, detail) VALUES (?, ?, "conversation_created", ?)'
    )->execute([
        $user['id'],
        $convId,
        json_encode(['role' => $role, 'topic' => $topic]),
    ]);

    jsonResponse(['success' => true, 'conversation_id' => $convId, 'opening_message' => $openingMessage, 'opening_message_2' => $openingMessage2]);
}

// ── Send message ──────────────────────────────────────────────────────────────
if ($action === 'send_message') {
    $convId  = (int) ($body['conversation_id'] ?? 0);
    $message = trim($body['message'] ?? '');

    if (!$convId || !$message) {
        jsonResponse(['error' => 'conversation_id and message are required.'], 400);
    }

    // Verify conversation exists and belongs to this user
    $stmt = $db->prepare('SELECT * FROM conversations WHERE id = ? LIMIT 1');
    $stmt->execute([$convId]);
    $conv = $stmt->fetch();

    if (!$conv) {
        error_log("[chat.php] send_message: conv $convId not found. user_id=" . $user['id']);
        jsonResponse(['error' => 'Conversation not found (id=' . $convId . '). Please start a new chat.'], 404);
    }

    if ((int)$conv['user_id'] !== (int)$user['id']) {
        error_log("[chat.php] send_message: conv $convId belongs to user {$conv['user_id']}, not {$user['id']}");
        jsonResponse(['error' => 'This conversation belongs to a different user.'], 403);
    }
    if ($conv['ended_at'] !== null) {
        jsonResponse(['error' => 'This conversation has already ended.'], 409);
    }

    // Persist user message
    $db->prepare(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, "user", ?)'
    )->execute([$convId, $message]);

    // Load full message history (system + prior turns) for OpenAI
    $stmt = $db->prepare(
        'SELECT role, content FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC'
    );
    $stmt->execute([$convId]);
    $history = $stmt->fetchAll();

    $openaiMessages = array_map(
        fn($m) => ['role' => $m['role'], 'content' => $m['content']],
        $history
    );

    // Call OpenAI Chat Completions API
    $payload = json_encode([
        'model'       => OPENAI_MODEL,
        'messages'    => $openaiMessages,
        'temperature' => 0.7,
    ]);

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . OPENAI_API_KEY,
        ],
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_TIMEOUT        => 60,
    ]);

    $raw      = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);

    if ($curlErr) {
        error_log('[chat.php] curl error: ' . $curlErr);
        jsonResponse(['error' => 'Network error reaching OpenAI: ' . $curlErr], 502);
    }

    $data = json_decode($raw, true);

    if ($httpCode !== 200) {
        $errMsg = $data['error']['message'] ?? $raw;
        error_log('[chat.php] OpenAI HTTP ' . $httpCode . ': ' . $errMsg);
        jsonResponse(['error' => 'OpenAI API error (' . $httpCode . '): ' . $errMsg], 502);
    }

    if (!isset($data['choices'][0]['message']['content'])) {
        error_log('[chat.php] Unexpected OpenAI response: ' . $raw);
        jsonResponse(['error' => 'Unexpected response structure from OpenAI. Raw: ' . substr($raw, 0, 300)], 502);
    }

    $assistantContent = $data['choices'][0]['message']['content'];
    $tokensUsed       = $data['usage']['total_tokens'] ?? null;
    $promptTokens     = $data['usage']['prompt_tokens'] ?? null;
    $completionTokens = $data['usage']['completion_tokens'] ?? null;

    // Persist assistant response
    $db->prepare(
        'INSERT INTO messages (conversation_id, role, content, tokens_used) VALUES (?, "assistant", ?, ?)'
    )->execute([$convId, $assistantContent, $tokensUsed]);

    // Log the exchange
    $db->prepare(
        'INSERT INTO logs (user_id, conversation_id, event, detail) VALUES (?, ?, "message_exchange", ?)'
    )->execute([
        $user['id'],
        $convId,
        json_encode([
            'prompt_tokens'     => $promptTokens,
            'completion_tokens' => $completionTokens,
            'total_tokens'      => $tokensUsed,
            'model'             => OPENAI_MODEL,
        ]),
    ]);

    jsonResponse([
        'success'           => true,
        'message'           => $assistantContent,
        'tokens_used'       => $tokensUsed,
        'prompt_tokens'     => $promptTokens,
        'completion_tokens' => $completionTokens,
    ]);
}

// ── End conversation ──────────────────────────────────────────────────────────
if ($action === 'end_conversation') {
    $convId = (int) ($body['conversation_id'] ?? 0);

    $db->prepare(
        "UPDATE conversations SET ended_at = datetime('now') WHERE id = ? AND user_id = ?"
    )->execute([$convId, $user['id']]);

    $db->prepare(
        'INSERT INTO logs (user_id, conversation_id, event, detail) VALUES (?, ?, "conversation_ended", "{}")'
    )->execute([$user['id'], $convId]);

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Unknown action.'], 400);
