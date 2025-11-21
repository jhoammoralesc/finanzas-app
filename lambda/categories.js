const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', type: 'expense', keywords: ['comida', 'almuerzo', 'cena', 'desayuno', 'restaurante', 'mercado', 'supermercado'] },
  { name: 'Transporte', type: 'expense', keywords: ['taxi', 'uber', 'bus', 'gasolina', 'combustible', 'transporte', 'metro'] },
  { name: 'Entretenimiento', type: 'expense', keywords: ['cine', 'concierto', 'fiesta', 'bar', 'diversión', 'entretenimiento'] },
  { name: 'Salud', type: 'expense', keywords: ['doctor', 'medicina', 'farmacia', 'hospital', 'salud', 'médico'] },
  { name: 'Educación', type: 'expense', keywords: ['curso', 'libro', 'educación', 'universidad', 'colegio', 'estudio'] },
  { name: 'Servicios', type: 'expense', keywords: ['luz', 'agua', 'internet', 'teléfono', 'servicio', 'recibo'] }
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      return await getCategories(userId);
    }

    if (event.httpMethod === 'POST') {
      return await createCategory(userId, event);
    }

    if (event.httpMethod === 'DELETE' && event.pathParameters?.categoryId) {
      return await deleteCategory(userId, event.pathParameters.categoryId);
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

async function getCategories(userId) {
  const result = await docClient.send(new QueryCommand({
    TableName: 'finanzas-categories',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  }));

  const customCategories = result.Items || [];
  
  // Combine default + custom categories
  const allCategories = [
    ...DEFAULT_CATEGORIES.map(c => ({ ...c, isDefault: true })),
    ...customCategories.map(c => ({ ...c, isDefault: false }))
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(allCategories)
  };
}

async function createCategory(userId, event) {
  const data = JSON.parse(event.body);
  const { name, type, keywords } = data;

  if (!name || !type) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and type required' }) };
  }

  const categoryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await docClient.send(new PutCommand({
    TableName: 'finanzas-categories',
    Item: {
      userId,
      categoryId,
      name,
      type,
      keywords: keywords || [],
      createdAt: new Date().toISOString()
    }
  }));

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ success: true, categoryId })
  };
}

async function deleteCategory(userId, categoryId) {
  await docClient.send(new DeleteCommand({
    TableName: 'finanzas-categories',
    Key: { userId, categoryId }
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}
