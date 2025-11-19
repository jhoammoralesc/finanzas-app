const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

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
        return await updateBudget(userId, event.pathParameters.id, body, headers);
      case 'DELETE':
        return await deleteBudget(userId, event.pathParameters.id, headers);
      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Method not supported' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

async function getBudgets(userId, headers) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  };

  const result = await docClient.send(new QueryCommand(params));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items) };
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
  const params = {
    TableName: TABLE_NAME,
    Key: { userId, budgetId },
    UpdateExpression: 'set amount = :amount, spent = :spent',
    ExpressionAttributeValues: {
      ':amount': data.amount,
      ':spent': data.spent
    },
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
