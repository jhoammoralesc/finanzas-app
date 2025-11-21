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

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod === 'POST' && event.path.includes('link-whatsapp')) {
    return await linkWhatsApp(userId, event, headers);
  }

  if (event.httpMethod === 'POST' && event.path.includes('verify-whatsapp')) {
    return await verifyWhatsApp(userId, event, headers);
  }

  if (event.httpMethod === 'GET') {
    return await getUser(userId, headers);
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

async function linkWhatsApp(userId, event, headers) {
  const data = JSON.parse(event.body);
  const { whatsappNumber } = data;

  if (!whatsappNumber) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'whatsappNumber required' }) };
  }

  // Check if number is already registered
  const existing = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: 'whatsapp-index',
    KeyConditionExpression: 'whatsappNumber = :phone',
    ExpressionAttributeValues: {
      ':phone': whatsappNumber.replace(/\s/g, '')
    }
  }));

  if (existing.Items && existing.Items.length > 0 && existing.Items[0].userId !== userId) {
    return { 
      statusCode: 409, 
      headers, 
      body: JSON.stringify({ error: 'Este número ya está registrado por otro usuario' }) 
    };
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store pending verification
  await docClient.send(new PutCommand({
    TableName: 'finanzas-users',
    Item: {
      userId,
      whatsappNumber: whatsappNumber.replace(/\s/g, ''),
      otp,
      expiresAt,
      verified: false,
      createdAt: new Date().toISOString()
    }
  }));

  // Send OTP via WhatsApp
  await sendWhatsAppOTP(whatsappNumber, otp);

  return { 
    statusCode: 200, 
    headers, 
    body: JSON.stringify({ 
      success: true, 
      message: 'Código de verificación enviado a WhatsApp' 
    }) 
  };
}

async function verifyWhatsApp(userId, event, headers) {
  const data = JSON.parse(event.body);
  const { otp } = data;

  if (!otp) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'OTP required' }) };
  }

  const result = await docClient.send(new GetCommand({
    TableName: 'finanzas-users',
    Key: { userId }
  }));

  const user = result.Item;

  if (!user || !user.otp) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'No hay verificación pendiente' }) };
  }

  if (user.expiresAt < Date.now()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código expirado' }) };
  }

  if (user.otp !== otp) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código incorrecto' }) };
  }

  // Mark as verified
  await docClient.send(new PutCommand({
    TableName: 'finanzas-users',
    Item: {
      ...user,
      verified: true,
      otp: undefined,
      expiresAt: undefined
    }
  }));

  return { 
    statusCode: 200, 
    headers, 
    body: JSON.stringify({ success: true, message: 'WhatsApp verificado correctamente' }) 
  };
}

async function sendWhatsAppOTP(phoneNumber, otp) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID || '896172040246487';

  console.log('Sending OTP to:', phoneNumber, 'Phone ID:', phoneId);

  if (!token || token === 'TEMP_TOKEN') {
    console.log('WhatsApp token not configured, OTP:', otp);
    return;
  }

  try {
    const normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
    console.log('Normalized phone:', normalizedPhone);
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        text: { 
          body: `🔐 Tu código de verificación para FinanzasApp es: ${otp}\n\nVálido por 10 minutos.` 
        }
      })
    });

    const responseText = await response.text();
    console.log('WhatsApp API response:', response.status, responseText);
    
    if (!response.ok) {
      console.error('WhatsApp API error:', responseText);
      throw new Error(`WhatsApp API error: ${responseText}`);
    }
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw error;
  }
}

async function getUser(userId, headers) {
  const result = await docClient.send(new GetCommand({
    TableName: 'finanzas-users',
    Key: { userId }
  }));

  const user = result.Item;
  
  // Don't expose OTP
  if (user && user.otp) {
    delete user.otp;
  }

  return { statusCode: 200, headers, body: JSON.stringify({ user: user || null }) };
}
