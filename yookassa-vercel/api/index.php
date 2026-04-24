<?php
// api/index.php
// CORS заголовки — самые первые строки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Обработка preflight запросов (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ⚠️ ЗАМЕНИ НА СВОИ ДАННЫЕ
$shopId = '1337044';
$secretKey = 'live_Rq5Wfrw2cdD_Bv0W0FEPkyB6J5HdpjC3uIZ7VoYp9wU';

// Получаем данные из запроса
$input = json_decode(file_get_contents('php://input'), true);

// Проверяем, что данные пришли
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Нет данных']);
    exit();
}

$amount = $input['amount'];
$orderId = $input['order_id'];
$returnUrl = $input['return_url'] ?? 'http://ogon-i-dim37.ru/thankyou';

// Формируем авторизацию
$auth = base64_encode($shopId . ':' . $secretKey);

// Данные для платежа
$paymentData = [
    'amount' => [
        'value' => number_format($amount, 2, '.', ''),
        'currency' => 'RUB'
    ],
    'confirmation' => [
        'type' => 'redirect',
        'return_url' => $returnUrl
    ],
    'description' => 'Заказ №' . $orderId,
    'metadata' => ['order_id' => $orderId]
];

// Отправляем запрос в ЮKassa
$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Basic ' . $auth,
    'Idempotence-Key: uniqid("", true)'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Возвращаем результат
if ($httpCode === 200) {
    $result = json_decode($response, true);
    echo json_encode([
        'success' => true,
        'confirmation_url' => $result['confirmation']['confirmation_url']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка ' . $httpCode . ': ' . $response
    ]);
}
