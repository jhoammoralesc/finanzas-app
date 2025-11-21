const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const lambdaClient = new LambdaClient({ region: 'us-east-2' });
const ddbClient = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
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
    await sendWhatsAppMessage(from, '❌ Usuario no registrado. Vincula tu WhatsApp desde la app web.');
    return;
  }

  const parsed = await parseMessage(messageText, userId);
  
  if (!parsed) {
    console.log('Message not recognized:', messageText);
    await sendWhatsAppMessage(from, '❓ No entendí tu mensaje. Ejemplos:\n• Gasté 25000 en almuerzo\n• Recibí 1000000 de salario\n• Reporte');
    return;
  }

  if (parsed.type === 'transaction') {
    await createTransaction(userId, parsed.data);
    const emoji = parsed.data.transactionType === 'expense' ? '💸' : '💰';
    const type = parsed.data.transactionType === 'expense' ? 'Gasto' : 'Ingreso';
    await sendWhatsAppMessage(from, `${emoji} ${type} registrado:\n$${parsed.data.amount.toLocaleString()} - ${parsed.data.category}`);
  } else if (parsed.type === 'budget') {
    await createBudget(userId, parsed.data);
    await sendWhatsAppMessage(from, `🎯 Presupuesto creado:\n$${parsed.data.amount.toLocaleString()} para ${parsed.data.category}`);
  } else if (parsed.type === 'report') {
    await generateReport(userId);
    await sendWhatsAppMessage(from, '📊 Generando reporte...');
  }
}

async function getUserByWhatsApp(whatsappNumber) {
  // Normalize: WhatsApp sends without +, but we store with +
  const normalizedNumber = whatsappNumber.startsWith('+') ? whatsappNumber : `+${whatsappNumber}`;
  
  const result = await docClient.send(new QueryCommand({
    TableName: 'finanzas-users',
    IndexName: 'whatsapp-index',
    KeyConditionExpression: 'whatsappNumber = :phone',
    FilterExpression: 'verified = :verified',
    ExpressionAttributeValues: {
      ':phone': normalizedNumber,
      ':verified': true
    }
  }));

  return result.Items?.[0]?.userId;
}

async function parseMessage(text, userId) {
  const lower = text.toLowerCase();

  // Transaction patterns
  const expenseMatch = lower.match(/(?:gast[eé]|pagu[eé]|compr[eé])\s*\$?(\d+(?:\.\d+)?)\s+(?:en|de|para|por)\s+(.+)/i);
  if (expenseMatch) {
    const description = expenseMatch[2].trim();
    return {
      type: 'transaction',
      data: {
        amount: parseFloat(expenseMatch[1]),
        description,
        category: await categorize(description, userId),
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

async function categorize(description, userId) {
  const desc = description.toLowerCase();
  
  try {
    // Obtener categorías
    const defaultResult = await docClient.send(new QueryCommand({
      TableName: 'finanzas-categories',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': 'DEFAULT' }
    }));

    const customResult = await docClient.send(new QueryCommand({
      TableName: 'finanzas-categories',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }));

    const allCategories = [...(defaultResult.Items || []), ...(customResult.Items || [])];

    // 1. Try keywords first (fast, free)
    for (const category of allCategories) {
      const validKeywords = (category.keywords || [])
        .filter(k => k.length > 1)
        .sort((a, b) => b.length - a.length);
      
      if (validKeywords.some(k => desc.includes(k.toLowerCase()))) {
        return category.name;
      }
    }

    // 2. Use Bedrock for ambiguous cases
    const categoryNames = allCategories.map(c => c.name).join(', ');
    const prompt = `Categoriza este gasto en UNA categoría: ${categoryNames}

Gasto: "${description}"

Responde SOLO el nombre de la categoría.`;

    const response = await bedrockClient.send(new InvokeModelCommand({
      modelId: 'amazon.nova-micro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 20, temperature: 0 }
      })
    }));

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const category = result.output?.message?.content?.[0]?.text?.trim();
    
    // Validar y aprender
    const matchedCategory = allCategories.find(c => c.name === category);
    if (matchedCategory) {
      // Extraer palabras clave de la descripción y agregarlas a la categoría
      await learnFromTransaction(description, matchedCategory, userId);
      return category;
    }
  } catch (error) {
    console.error('Categorization error:', error);
  }
  
  return 'Otros';
}

async function learnFromTransaction(description, category, userId) {
  try {
    // Extraer palabras significativas (>3 letras, no números)
    const words = description.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !/^\d+$/.test(w));
    
    if (words.length === 0) return;

    // Actualizar keywords de la categoría del usuario (crear custom si no existe)
    await docClient.send(new UpdateCommand({
      TableName: 'finanzas-categories',
      Key: { userId, categoryId: category.categoryId },
      UpdateExpression: 'SET keywords = list_append(if_not_exists(keywords, :empty), :words), #name = :name, #type = :type',
      ExpressionAttributeNames: { '#name': 'name', '#type': 'type' },
      ExpressionAttributeValues: {
        ':words': words,
        ':name': category.name,
        ':type': category.type,
        ':empty': []
      }
    }));
    
    console.log(`✨ Learned: ${words.join(', ')} → ${category.name}`);
  } catch (error) {
    console.error('Learning error:', error);
  }
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

async function sendWhatsAppMessage(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  
  if (!token || token === 'TEMP_TOKEN') {
    console.log('WhatsApp token not configured, skipping message');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        text: { body: message }
      })
    });
    
    if (!response.ok) {
      console.error('WhatsApp API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
  }
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

  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: 'finanzas-transactions',
    Payload: JSON.stringify(payload)
  }));

  const result = JSON.parse(Buffer.from(response.Payload).toString());
  const body = JSON.parse(result.body);
  
  const transactions = body.transactions || [];
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  console.log(`Report - Income: ${totalIncome}, Expense: ${totalExpense}, Balance: ${balance}`);
}

