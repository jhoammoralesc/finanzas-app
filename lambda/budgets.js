const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'finanzas-budgets';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    switch (method) {
      case 'GET':
        return await getBudgets(userId, headers);
      case 'POST':
        return await createBudget(userId, body, headers);
      case 'PUT':
        const budgetId = event.pathParameters?.id || event.pathParameters?.budgetId;
        return await updateBudget(userId, budgetId, body, headers);
      case 'DELETE':
        const deleteId = event.pathParameters?.id || event.pathParameters?.budgetId;
        return await deleteBudget(userId, deleteId, headers);
      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Method not supported' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

async function getBudgets(userId, headers) {
  console.log('Getting budgets for user:', userId);
  
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  };

  const result = await docClient.send(new QueryCommand(params));
  console.log('Found budgets:', result.Items.length);
  
  // Create default budgets if user has none
  if (result.Items.length === 0) {
    console.log('Creating default budgets for new user');
    const defaultBudgets = [
      { category: 'Alimentación', amount: 500000 },
      { category: 'Transporte', amount: 200000 },
      { category: 'Entretenimiento', amount: 150000 },
      { category: 'Servicios', amount: 300000 },
      { category: 'Salud', amount: 100000 },
      { category: 'Educación', amount: 100000 }
    ];

    for (const budget of defaultBudgets) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId,
          budgetId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: budget.category,
          amount: budget.amount,
          period: 'monthly',
          createdAt: new Date().toISOString()
        }
      }));
    }

    // Re-query to get the newly created budgets
    const newResult = await docClient.send(new QueryCommand(params));
    result.Items = newResult.Items;
  }
  
  // Get current month transactions
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startDateStr = startOfMonth.toISOString().split('T')[0]; // Format: 2025-11-01
  console.log('Start of month:', startDateStr);

  const transactionsResult = await docClient.send(new ScanCommand({
    TableName: 'finanzas-transactions',
    FilterExpression: 'userId = :userId AND #date >= :startDate AND #type = :typeValue',
    ExpressionAttributeNames: { 
      '#date': 'date',
      '#type': 'type'
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':startDate': startDateStr,
      ':typeValue': 'expense'
    }
  }));

  console.log('Found transactions:', transactionsResult.Items.length);
  console.log('Transactions:', JSON.stringify(transactionsResult.Items, null, 2));

  // Calculate spent per category
  const spentByCategory = {};
  (transactionsResult.Items || []).forEach(t => {
    console.log('Processing transaction:', t.category, t.amount);
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
  });

  console.log('Spent by category:', spentByCategory);

  // Merge budgets with spent amounts
  const budgets = result.Items.map(budget => ({
    ...budget,
    spent: spentByCategory[budget.category] || 0,
    remaining: budget.amount - (spentByCategory[budget.category] || 0),
    percentage: ((spentByCategory[budget.category] || 0) / budget.amount * 100).toFixed(1)
  }));

  console.log('Final budgets:', JSON.stringify(budgets, null, 2));

  return { statusCode: 200, headers, body: JSON.stringify(budgets) };
}

async function createBudget(userId, data, headers) {
  const budget = {
    userId,
    budgetId: Date.now().toString(),
    category: data.category,
    amount: data.amount,
    spent: 0,
    period: data.period,
    createdAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: budget
  }));

  return { statusCode: 201, headers, body: JSON.stringify(budget) };
}

async function updateBudget(userId, budgetId, data, headers) {
  const updateExpressions = [];
  const expressionAttributeValues = {};
  
  if (data.amount !== undefined) {
    updateExpressions.push('amount = :amount');
    expressionAttributeValues[':amount'] = data.amount;
  }
  
  if (data.category !== undefined) {
    updateExpressions.push('category = :category');
    expressionAttributeValues[':category'] = data.category;
  }
  
  if (updateExpressions.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };
  }

  const params = {
    TableName: TABLE_NAME,
    Key: { userId, budgetId },
    UpdateExpression: 'set ' + updateExpressions.join(', '),
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  const result = await docClient.send(new UpdateCommand(params));
  return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
}

async function deleteBudget(userId, budgetId, headers) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { userId, budgetId }
  }));

  return { statusCode: 200, headers, body: JSON.stringify({ message: 'Budget deleted' }) };
}
