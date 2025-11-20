const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const lambdaClient = new LambdaClient({ region: 'us-east-2' });
const ddbClient = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'finanzas-verify-token';

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Webhook verification
  if (event.httpMethod === 'GET') {
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return {
        statusCode: 200,
        body: challenge
      };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  // Process incoming messages
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      
      console.log('Body:', JSON.stringify(body, null, 2));
      
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            console.log('Change:', JSON.stringify(change, null, 2));
            if (change.value?.messages) {
              for (const message of change.value.messages) {
                console.log('Processing message:', message);
                await processMessage(message, change.value.metadata);
              }
            }
          }
        }
      }

      return { statusCode: 200, body: 'OK' };
    } catch (error) {
      console.error('Error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};

async function processMessage(message, metadata) {
  const { from, text } = message;
  const messageText = text?.body || '';

  const userId = await getUserByWhatsApp(from);
  if (!userId) {
    console.log('User not found for WhatsApp:', from);
    return;
  }

  const parsed = parseMessage(messageText);
  
  if (!parsed) {
    console.log('Message not recognized:', messageText);
    return;
  }

  if (parsed.type === 'transaction') {
    await createTransaction(userId, parsed.data);
  } else if (parsed.type === 'budget') {
    await createBudget(userId, parsed.data);
  } else if (parsed.type === 'report') {
    await generateReport(userId);
  }
}

async function getUserByWhatsApp(whatsappNumber) {
  const result = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: 'whatsapp-index',
    KeyConditionExpression: 'whatsappNumber = :phone',
    ExpressionAttributeValues: {
      ':phone': whatsappNumber
    }
  }));

  return result.Items?.[0]?.userId;
}

function parseMessage(text) {
  const lower = text.toLowerCase();

  // Transaction patterns
  const expenseMatch = lower.match(/(?:gast[eé]|pagu[eé]|compr[eé])\s*\$?(\d+(?:\.\d+)?)\s+(?:en|de|para|por)\s+(.+)/i);
  if (expenseMatch) {
    return {
      type: 'transaction',
      data: {
        amount: parseFloat(expenseMatch[1]),
        description: expenseMatch[2].trim(),
        category: categorize(expenseMatch[2]),
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

  // Budget patterns
  const budgetMatch = lower.match(/(?:presupuesto|budget)\s+(?:de\s+)?\$?(\d+(?:\.\d+)?)\s+(?:para|en)\s+(.+)/i);
  if (budgetMatch) {
    return {
      type: 'budget',
      data: {
        amount: parseFloat(budgetMatch[1]),
        category: budgetMatch[2].trim(),
        period: 'month'
      }
    };
  }

  // Report patterns
  if (lower.match(/(?:reporte|resumen|balance|saldo|gastos)/)) {
    return { type: 'report' };
  }

  return null;
}

function categorize(description) {
  const desc = description.toLowerCase();
  const categories = {
    'Alimentación': ['comida', 'almuerzo', 'cena', 'desayuno', 'restaurante', 'mercado'],
    'Transporte': ['taxi', 'uber', 'gasolina', 'bus', 'metro'],
    'Entretenimiento': ['cine', 'netflix', 'spotify', 'bar'],
    'Salud': ['farmacia', 'medicina', 'doctor'],
    'Educación': ['libro', 'curso', 'universidad'],
    'Servicios': ['luz', 'agua', 'internet']
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => desc.includes(k))) return cat;
  }
  return 'Otros';
}

async function createTransaction(userId, data) {
  const payload = {
    httpMethod: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      description: data.description,
      category: data.category,
      type: data.transactionType,
      date: new Date().toISOString().split('T')[0],
      source: 'whatsapp'
    }),
    requestContext: {
      authorizer: {
        claims: { sub: userId }
      }
    }
  };

  await lambdaClient.send(new InvokeCommand({
    FunctionName: 'finanzas-transactions',
    Payload: JSON.stringify(payload)
  }));
}

async function createBudget(userId, data) {
  const payload = {
    httpMethod: 'POST',
    body: JSON.stringify({
      category: data.category,
      amount: data.amount,
      period: data.period
    }),
    requestContext: {
      authorizer: {
        claims: { sub: userId }
      }
    }
  };

  await lambdaClient.send(new InvokeCommand({
    FunctionName: 'finanzas-budgets',
    Payload: JSON.stringify(payload)
  }));
}

async function generateReport(userId) {
  const payload = {
    httpMethod: 'GET',
    requestContext: {
      authorizer: {
        claims: { sub: userId }
      }
    }
  };

  await lambdaClient.send(new InvokeCommand({
    FunctionName: 'finanzas-transactions',
    Payload: JSON.stringify(payload)
  }));
}

