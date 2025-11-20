const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

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

  const user = {
    userId,
    whatsappNumber: whatsappNumber.replace(/\s/g, ''),
    email: event.requestContext?.authorizer?.claims?.email,
    createdAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: 'finanzas-users',
    Item: user
  }));

  return { statusCode: 200, headers, body: JSON.stringify({ success: true, user }) };
}

async function getUser(userId, headers) {
  const result = await docClient.send(new GetCommand({
    TableName: 'finanzas-users',
    Key: { userId }
  }));

  return { statusCode: 200, headers, body: JSON.stringify({ user: result.Item || null }) };
}
