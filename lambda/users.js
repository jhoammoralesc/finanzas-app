const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  if (event.httpMethod === 'POST' && event.path.includes('link-whatsapp')) return await linkMessaging(userId, event, headers, 'whatsapp');
  if (event.httpMethod === 'POST' && event.path.includes('verify-whatsapp')) return await verifyMessaging(userId, event, headers, 'whatsapp');
  if (event.httpMethod === 'POST' && event.path.includes('link-telegram')) return await linkMessaging(userId, event, headers, 'telegram');
  if (event.httpMethod === 'POST' && event.path.includes('verify-telegram')) return await verifyMessaging(userId, event, headers, 'telegram');
  if (event.httpMethod === 'GET') return await getUser(userId, headers);

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

async function linkMessaging(userId, event, headers, platform) {
  const data = JSON.parse(event.body);
  const phoneNumber = platform === 'whatsapp' ? data.whatsappNumber : data.telegramNumber;
  if (!phoneNumber) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Número de teléfono requerido' }) };

  const field = platform === 'whatsapp' ? 'whatsappNumber' : 'telegramNumber';
  const indexName = platform === 'whatsapp' ? 'whatsapp-index' : 'telegram-number-index';
  
  const existing = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: indexName,
    KeyConditionExpression: `${field} = :id`,
    ExpressionAttributeValues: { ':id': phoneNumber.replace(/\s/g, '') }
  }));

  if (existing.Items?.length > 0 && existing.Items[0].userId !== userId) {
    return { statusCode: 409, headers, body: JSON.stringify({ error: 'Ya está registrado por otro usuario' }) };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  await docClient.send(new PutCommand({
    TableName: 'finanzas-users',
    Item: {
      userId,
      [field]: phoneNumber.replace(/\s/g, ''),
      otp,
      expiresAt,
      verified: false,
      createdAt: new Date().toISOString()
    }
  }));

  const sent = await sendOTP(platform, phoneNumber, otp);
  
  return { 
    statusCode: 200, 
    headers, 
    body: JSON.stringify({ 
      success: true, 
      message: platform === 'telegram' ? 'Abre el bot y envía este código' : 'Código enviado',
      otp: platform === 'telegram' ? otp : undefined,
      botLink: platform === 'telegram' ? 'https://t.me/FinanzasAppBot' : null 
    }) 
  };
}

async function verifyMessaging(userId, event, headers, platform) {
  const data = JSON.parse(event.body);
  if (!data.otp) return { statusCode: 400, headers, body: JSON.stringify({ error: 'OTP required' }) };

  const result = await docClient.send(new GetCommand({ TableName: 'finanzas-users', Key: { userId } }));
  const user = result.Item;

  if (!user?.otp) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No hay verificación pendiente' }) };
  if (user.expiresAt < Date.now()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código expirado' }) };
  if (user.otp !== data.otp) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código incorrecto' }) };

  await docClient.send(new PutCommand({
    TableName: 'finanzas-users',
    Item: { ...user, verified: true, otp: undefined, expiresAt: undefined }
  }));

  return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: `${platform} verificado` }) };
}

async function sendOTP(platform, phoneNumber, otp) {
  const normalized = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
  
  if (platform === 'whatsapp') {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token) { console.log('WhatsApp not configured, OTP:', otp); return false; }
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: normalized, text: { body: `🔐 Código FinanzasApp: ${otp}\nVálido 10 min.` } })
    });
    return response.ok;
  } else if (platform === 'telegram') {
    // Telegram requiere que el usuario inicie chat primero
    // El OTP se enviará cuando el usuario escriba al bot
    console.log(`Telegram OTP pendiente para ${normalized}: ${otp}`);
    return true;
  }
  return false;
}

async function getUser(userId, headers) {
  const result = await docClient.send(new GetCommand({ TableName: 'finanzas-users', Key: { userId } }));
  const user = result.Item;
  if (user?.otp) delete user.otp;
  return { statusCode: 200, headers, body: JSON.stringify({ user: user || null }) };
}
