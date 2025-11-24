const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const lambdaClient = new LambdaClient({ region: 'us-east-2' });
const ddbClient = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // WhatsApp webhook verification (GET)
  if (event.httpMethod === 'GET') {
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      return { statusCode: 200, body: challenge };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  const body = event.body ? JSON.parse(event.body) : {};

  // Detect platform
  if (body.object === 'whatsapp_business_account') {
    await handleWhatsApp(body);
  } else if (body.message || body.update_id) {
    await handleTelegram(body);
  }

  return { statusCode: 200, body: 'OK' };
};

async function handleWhatsApp(body) {
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.value?.messages) {
        for (const message of change.value.messages) {
          const from = message.from;
          const text = message.text?.body || '';
          const userId = await getUserByPhone(from, 'whatsapp');
          if (!userId) {
            await sendMessage('whatsapp', from, '❌ Usuario no registrado. Vincula tu cuenta desde la app web.');
            continue;
          }
          await processMessage(userId, text, 'whatsapp', from);
        }
      }
    }
  }
}

async function handleTelegram(body) {
  const message = body.message;
  if (!message) return;
  
  const chatId = message.chat.id.toString();
  const text = (message.text || '').trim();
  
  // Buscar usuario verificado
  let user = await getUserByChatId(chatId);
  
  if (!user) {
    // Verificar si el texto es un OTP (6 dígitos)
    if (/^\d{6}$/.test(text)) {
      const pendingUser = await getUserPendingByOTP(text);
      if (pendingUser && pendingUser.expiresAt > Date.now()) {
        // Asociar chatId y verificar
        await docClient.send(new UpdateCommand({
          TableName: 'finanzas-users',
          Key: { userId: pendingUser.userId },
          UpdateExpression: 'SET telegramChatId = :chatId, verified = :verified REMOVE otp, expiresAt',
          ExpressionAttributeValues: { ':chatId': chatId, ':verified': true }
        }));
        await sendMessage('telegram', chatId, '✅ Telegram vinculado correctamente.\n\nYa puedes enviar transacciones:\n• Gasté 25000 en almuerzo\n• Recibí 1000000 de salario');
        return;
      }
      await sendMessage('telegram', chatId, '❌ Código inválido o expirado.');
      return;
    }
    
    await sendMessage('telegram', chatId, '❌ No estás registrado.\n\n📱 Para vincular:\n1. Ve a https://d2lrwv7cxtby1n.amplifyapp.com\n2. Vincula tu Telegram\n3. Envía el código aquí');
    return;
  }
  
  await processMessage(user.userId, text, 'telegram', chatId);
}

async function getUserPendingByOTP(otp) {
  const result = await docClient.send(new ScanCommand({
    TableName: 'finanzas-users',
    FilterExpression: 'otp = :otp AND verified = :verified',
    ExpressionAttributeValues: { ':otp': otp, ':verified': false }
  }));
  return result.Items?.[0];
}

async function getUserPendingByPhone(phoneNumber) {
  const normalized = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
  const result = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: 'telegram-number-index',
    KeyConditionExpression: 'telegramNumber = :phone',
    ExpressionAttributeValues: { ':phone': normalized }
  }));
  return result.Items?.[0];
}

async function getUserByChatId(chatId) {
  const result = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: 'telegram-index',
    KeyConditionExpression: 'telegramChatId = :chatId',
    FilterExpression: 'verified = :verified',
    ExpressionAttributeValues: { ':chatId': chatId, ':verified': true }
  }));
  
  return result.Items?.[0];
}

async function getUserByPhone(identifier, platform) {
  const indexName = platform === 'whatsapp' ? 'whatsapp-index' : 'telegram-index';
  const field = platform === 'whatsapp' ? 'whatsappNumber' : 'telegramChatId';
  const normalized = platform === 'whatsapp' && !identifier.startsWith('+') ? `+${identifier}` : identifier;
  
  const result = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: indexName,
    KeyConditionExpression: `${field} = :id`,
    FilterExpression: 'verified = :verified',
    ExpressionAttributeValues: { ':id': normalized, ':verified': true }
  }));
  
  return result.Items?.[0]?.userId;
}

async function processMessage(userId, text, platform, identifier) {
  const parsed = await parseMessage(text, userId);
  
  if (!parsed) {
    await sendMessage(platform, identifier, '❓ No entendí. Ejemplos:\n• Gasté 25000 en almuerzo\n• Recibí 1000000 de salario\n• Reporte');
    return;
  }

  if (parsed.type === 'transaction') {
    await createTransaction(userId, parsed.data, platform);
    const emoji = parsed.data.transactionType === 'expense' ? '💸' : '💰';
    const type = parsed.data.transactionType === 'expense' ? 'Gasto' : 'Ingreso';
    await sendMessage(platform, identifier, `${emoji} ${type} registrado:\n$${parsed.data.amount.toLocaleString()} - ${parsed.data.category}`);
  } else if (parsed.type === 'report') {
    await sendMessage(platform, identifier, '📊 Generando reporte...');
  }
}

async function parseMessage(text, userId) {
  const lower = text.toLowerCase();
  const expenseMatch = lower.match(/(?:gast[eé]|pagu[eé]|compr[eé])\s*\$?(\d+(?:\.\d+)?)\s+(?:en|de|para|por)\s+(.+)/i);
  if (expenseMatch) {
    return {
      type: 'transaction',
      data: {
        amount: parseFloat(expenseMatch[1]),
        description: expenseMatch[2].trim(),
        category: await categorize(expenseMatch[2].trim(), userId),
        transactionType: 'expense'
      }
    };
  }
  const incomeMatch = lower.match(/(?:recib[ií]|ingres[oó]|cobr[eé])\s*\$?(\d+(?:\.\d+)?)\s+(?:de|por)?\s*(.+)/i);
  if (incomeMatch) {
    return {
      type: 'transaction',
      data: {
        amount: parseFloat(incomeMatch[1]),
        description: incomeMatch[2].trim(),
        category: 'Ingreso',
        transactionType: 'income'
      }
    };
  }
  if (lower.match(/(?:reporte|resumen|balance|saldo)/)) return { type: 'report' };
  return null;
}

async function categorize(description, userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: 'finanzas-categories',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }));
    const categories = result.Items || [];
    const desc = description.toLowerCase();
    for (const category of categories) {
      const keywords = (category.keywords || []).filter(k => k.length > 1);
      if (keywords.some(k => desc.includes(k.toLowerCase()))) return category.name;
    }
    return 'Otros';
  } catch (error) {
    return 'Otros';
  }
}

async function createTransaction(userId, data, platform) {
  await lambdaClient.send(new InvokeCommand({
    FunctionName: 'finanzas-transactions',
    Payload: JSON.stringify({
      httpMethod: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        category: data.category,
        type: data.transactionType,
        date: new Date().toISOString().split('T')[0],
        source: platform
      }),
      requestContext: { authorizer: { claims: { sub: userId } } }
    })
  }));
}

async function sendMessage(platform, identifier, message) {
  if (platform === 'whatsapp') {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token) return;
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: identifier, text: { body: message } })
    });
  } else if (platform === 'telegram') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: identifier, text: message })
    });
  }
}
