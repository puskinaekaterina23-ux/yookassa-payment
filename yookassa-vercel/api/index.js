// api/index.js
export default async function handler(req, res) {
  // Устанавливаем заголовки CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обрабатываем preflight запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Для GET запросов - проверка работы API
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'API работает!'
    });
  }
  
  // Только POST запросы для платежей
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }
  
  // ⚠️ ЗАМЕНИ НА СВОИ ДАННЫЕ ИЗ ЮKASSA ⚠️
  const SHOP_ID = '1337044';
  const SECRET_KEY = 'live_Rq5Wfrw2cdD_Bv0W0FEPkyB6J5HdpjC3uIZ7VoYp9wU';
  
  const { amount, order_id, return_url } = req.body;
  
  const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');
  
  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': Date.now().toString()
      },
      body: JSON.stringify({
        amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: return_url },
        description: `Заказ №${order_id}`,
        metadata: { order_id }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return res.status(200).json({
        success: true,
        confirmation_url: data.confirmation.confirmation_url
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.description || 'Ошибка создания платежа'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Ошибка подключения к ЮKassa'
    });
  }
}
