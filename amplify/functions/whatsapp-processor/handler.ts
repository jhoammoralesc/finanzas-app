import type { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { httpMethod, queryStringParameters, body } = event;

  // Verificación del webhook de WhatsApp
  if (httpMethod === 'GET') {
    const mode = queryStringParameters?.['hub.mode'];
    const token = queryStringParameters?.['hub.verify_token'];
    const challenge = queryStringParameters?.['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      return {
        statusCode: 200,
        body: challenge || '',
      };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  // Procesamiento de mensajes entrantes
  if (httpMethod === 'POST' && body) {
    try {
      const data = JSON.parse(body);
      
      if (data.object === 'whatsapp_business_account') {
        for (const entry of data.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              const messages = change.value.messages;
              
              for (const message of messages || []) {
                await processFinancialMessage(message, change.value.contacts[0]);
              }
            }
          }
        }
      }

      return { statusCode: 200, body: 'OK' };
    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      return { statusCode: 500, body: 'Internal Server Error' };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

async function processFinancialMessage(message: any, contact: any) {
  const messageText = message.text?.body?.toLowerCase() || '';
  
  // Patrones para detectar transacciones financieras
  const patterns = {
    expense: /(?:gast[eé]|compr[eé]|pagu[eé]|deb[eé])\s*(\d+(?:\.\d{3})*(?:,\d{2})?)\s*(?:en|para|de)?\s*(.+)/i,
    income: /(?:recib[íi]|ingres[oó]|gan[eé]|cobr[eé])\s*(\d+(?:\.\d{3})*(?:,\d{2})?)\s*(?:de|por)?\s*(.+)/i,
    balance: /(?:saldo|balance|cuanto tengo)/i,
    report: /(?:reporte|resumen|informe)\s*(?:del?\s*)?(?:mes|semana|d[íi]a)?/i,
  };

  let response = '';

  if (patterns.expense.test(messageText)) {
    const match = messageText.match(patterns.expense);
    if (match) {
      const amount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      const description = match[2].trim();
      
      // Aquí guardarías en DynamoDB
      response = `✅ Gasto registrado: $${amount.toLocaleString()} - ${description}`;
    }
  } else if (patterns.income.test(messageText)) {
    const match = messageText.match(patterns.income);
    if (match) {
      const amount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      const description = match[2].trim();
      
      response = `✅ Ingreso registrado: $${amount.toLocaleString()} - ${description}`;
    }
  } else if (patterns.balance.test(messageText)) {
    response = `💰 Tu saldo actual es: $XXX,XXX\n📊 Gastos del mes: $XX,XXX\n📈 Ingresos del mes: $XXX,XXX`;
  } else if (patterns.report.test(messageText)) {
    response = `📊 Resumen financiero:\n\n💸 Gastos principales:\n• Alimentación: $XXX\n• Transporte: $XXX\n• Entretenimiento: $XXX\n\n💡 Recomendación: Reduce gastos hormiga en $XXX`;
  } else {
    response = `Hola! 👋 Puedes registrar:\n\n💸 Gastos: "Gasté 50000 en almuerzo"\n💰 Ingresos: "Recibí 100000 por freelance"\n📊 Consultas: "saldo", "reporte del mes"`;
  }

  // Aquí enviarías la respuesta de vuelta por WhatsApp
  await sendWhatsAppMessage(contact.wa_id, response);
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  // Implementación para enviar mensaje por WhatsApp Business API
  console.log(`Sending to ${phoneNumber}: ${message}`);
}
