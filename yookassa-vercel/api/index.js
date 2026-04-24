// api/index.js
export default async function handler(req, res) {
  // Разрешаем CORS для всех запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обрабатываем preflight запрос (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // ⚠️ ЗАМЕНИ НА СВОИ ДАННЫЕ ИЗ ЮKASSA ⚠️
  const SHOP_ID = '1337044';        // Например: 123456
  const SECRET_KEY = 'live_Rq5Wfrw2cdD_Bv0W0FEPkyB6J5HdpjC3uIZ7VoYp9wU';  // Например: live_xxxxxxxxxxxxx
  
  const { amount, order_id, phone, name, return_url } = req.body;
  
  // Проверяем обязательные поля
  if (!amount || !order_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Не указана сумма или ID заказа' 
    });
  }
  
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
        amount: {
          value: Number(amount).toFixed(2),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: return_url || 'http://ogon-i-dim37.ru/thankyou'
        },
        description: `Заказ №${order_id}`,
        metadata: { 
          order_id: order_id,
          phone: phone || '',
          name: name || ''
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return res.status(200).json({
        success: true,
        confirmation_url: data.confirmation.confirmation_url,
        payment_id: data.id
      });
    } else {
      console.error('ЮKassa error:', data);
      return res.status(400).json({
        success: false,
        error: data.description || 'Ошибка создания платежа'
      });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка подключения к ЮKassa: ' + error.message
    });
  }
}
