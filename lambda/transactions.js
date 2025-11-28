const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'finanzas-transactions';

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
        return await getTransactions(userId, headers);
      case 'POST':
        return await createTransaction(userId, body, headers);
      case 'DELETE':
        return await deleteTransaction(userId, event.pathParameters.id, headers);
      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Method not supported' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

async function getTransactions(userId, headers) {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'userId-date-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false
  };

  const result = await docClient.send(new QueryCommand(params));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items) };
}

async function createTransaction(userId, data, headers) {
  const transaction = {
    id: Date.now().toString(),
    userId,
    amount: data.amount,
    description: data.description,
    category: data.category || 'Otros',
    type: data.type,
    date: data.date || new Date().toISOString().split('T')[0],
    source: data.source || 'manual',
    createdAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: transaction
  }));

  return { statusCode: 201, headers, body: JSON.stringify(transaction) };
}

async function deleteTransaction(userId, transactionId, headers) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { userId, id: transactionId }
  }));

  return { statusCode: 200, headers, body: JSON.stringify({ message: 'Transaction deleted' }) };
}
