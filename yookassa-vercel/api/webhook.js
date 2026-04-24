// api/webhook.js
export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Для GET запросов (проверка работоспособности)
  if (req.method === 'GET') {
    return res.status(200).send('Webhook is alive');
  }
  
  // Для POST запросов от ЮKassa
  if (req.method === 'POST') {
    const event = req.body;
    console.log('Webhook received:', event);
    
    // Логируем в файл (для отладки)
    const fs = require('fs');
    fs.appendFileSync('/tmp/webhook.log', JSON.stringify(event) + '\n');
    
    if (event.event === 'payment.succeeded') {
      const orderId = event.object.metadata.order_id;
      console.log(`✅ Заказ ${orderId} оплачен!`);
      // Здесь можно добавить отправку в Telegram
    }
    
    return res.status(200).send('OK');
  }
  
  return res.status(405).send('Method not allowed');
}
