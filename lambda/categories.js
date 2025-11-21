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
  { 
    name: 'Alimentación', 
    type: 'expense',
    icon: '🍔',
    description: 'Comidas, snacks, bebidas y supermercado',
    keywords: [
      // Comidas principales
      'comida', 'almuerzo', 'cena', 'desayuno', 'brunch', 'merienda',
      'restaurante', 'cafeteria', 'fonda', 'panaderia',
      'mercado', 'supermercado', 'tienda', 'minimercado', 'exito', 'carulla', 'olimpica',
      // Fast food y comida rápida (gastos hormiga)
      'pizza', 'hamburguesa', 'pollo', 'perro', 'hotdog', 'empanada', 'arepa', 
      'tacos', 'burrito', 'wrap', 'sanduche', 'sandwich', 'sub', 'subway',
      'mcdonalds', 'burger king', 'kfc', 'dominos', 'papa johns',
      // Snacks y dulces (gastos hormiga)
      'helado', 'helados', 'dulce', 'postre', 'snack', 'galletas', 'chocolate',
      'chicle', 'caramelo', 'golosina', 'chupete', 'bombom', 'torta', 'pastel',
      // Bebidas (gastos hormiga frecuentes)
      'café', 'cafeteria', 'starbucks', 'juan valdez', 'oma', 'tostao',
      'bebida', 'refresco', 'gaseosa', 'coca cola', 'pepsi', 'jugo', 'agua', 'te', 'smoothie',
      // Comida preparada
      'sushi', 'pasta', 'arroz', 'sopa', 'caldo', 'bandeja', 'corrientazo',
      // Ingredientes y compras
      'carne', 'pollo', 'pescado', 'mariscos', 'frutas', 'verduras', 'vegetales',
      'pan', 'huevos', 'lacteos', 'leche', 'queso', 'yogurt', 'mantequilla',
      'cereal', 'avena', 'granola', 'aceite', 'sal', 'azucar', 'condimentos',
      // Alcohol
      'cerveza', 'vino', 'licor', 'trago', 'whisky', 'ron', 'vodka', 'tequila', 
      'aguardiente', 'bar', 'cantina'
    ]
  },
  { 
    name: 'Transporte', 
    type: 'expense',
    icon: '🚗',
    description: 'Movilidad, combustible y estacionamiento',
    keywords: [
      // Apps de transporte (gastos hormiga)
      'taxi', 'uber', 'didi', 'cabify', 'beat', 'indriver', 'picap',
      // Combustible
      'gasolina', 'combustible', 'tanqueo', 'tanqueada', 'acpm', 'diesel',
      'terpel', 'mobil', 'esso', 'petrobras',
      // Transporte público
      'bus', 'buseta', 'colectivo', 'metro', 'transmilenio', 'sitp', 'mio',
      'pasaje', 'transporte', 'recarga', 'tullave', 'civica',
      // Estacionamiento
      'parqueadero', 'parqueo', 'estacionamiento', 'peaje', 'parquimetro',
      // Otros medios
      'moto', 'bicicleta', 'bici', 'patineta', 'scooter', 'patinete',
      'tren', 'avion', 'vuelo', 'aeropuerto', 'terminal', 'pasaje aereo',
      // Mantenimiento vehículo
      'mecanico', 'taller', 'cambio aceite', 'llantas', 'frenos', 'bateria',
      'lavado', 'lavadero', 'alineacion', 'balanceo', 'revision tecnicomecanica'
    ]
  },
  { 
    name: 'Entretenimiento', 
    type: 'expense',
    icon: '🎮',
    description: 'Ocio, streaming, salidas y diversión',
    keywords: [
      // Streaming y suscripciones (gastos hormiga mensuales)
      'netflix', 'spotify', 'prime', 'amazon prime', 'hbo', 'hbo max', 'disney', 'disney plus',
      'youtube', 'youtube premium', 'twitch', 'crunchyroll', 'paramount', 'star plus',
      'apple music', 'deezer', 'tidal', 'suscripcion', 'membresia',
      // Cine y teatro
      'cine', 'pelicula', 'cinemark', 'procinal', 'cinepolis', 'royal films',
      'teatro', 'obra', 'funcion',
      // Eventos y conciertos
      'concierto', 'show', 'evento', 'festival', 'feria', 'boleta', 'entrada',
      // Vida nocturna
      'bar', 'discoteca', 'club', 'fiesta', 'rumba', 'parranda', 'antro',
      // Paseos y actividades
      'parque', 'diversiones', 'feria', 'circo', 'zoologico', 'acuario',
      'museo', 'exposicion', 'galeria', 'planetario',
      'salida', 'paseo', 'plan', 'actividad', 'tour', 'excursion',
      // Gaming (gastos hormiga)
      'juego', 'videojuego', 'xbox', 'playstation', 'ps5', 'ps4', 'nintendo', 'switch',
      'steam', 'epic', 'epic games', 'fortnite', 'lol', 'valorant', 'fifa', 'gta',
      'skin', 'battle pass', 'pavos', 'robux', 'minecraft',
      // Apuestas (gastos hormiga peligrosos)
      'casino', 'apuesta', 'loteria', 'chance', 'baloto', 'poker', 'ruleta',
      'betplay', 'codere', 'wplay'
    ]
  },
  { 
    name: 'Salud', 
    type: 'expense',
    icon: '⚕️',
    description: 'Medicina, consultas y cuidado médico',
    keywords: [
      // Farmacias y medicamentos
      'farmacia', 'drogueria', 'cruz verde', 'cafam', 'colsubsidio',
      'medicina', 'medicamento', 'droga', 'pastilla', 'jarabe', 'capsula',
      'vitamina', 'suplemento', 'proteina', 'creatina',
      'antibiotico', 'analgesico', 'ibuprofeno', 'acetaminofen', 'dolex',
      // Consultas médicas
      'doctor', 'medico', 'consulta', 'cita', 'control', 'chequeo',
      'especialista', 'pediatra', 'ginecologo', 'cardiologo', 'dermatologo',
      // Centros médicos
      'hospital', 'clinica', 'centro medico', 'ips', 'urgencias', 'emergencia',
      // Odontología
      'dentista', 'odontologo', 'ortodoncia', 'brackets', 'limpieza dental',
      'calza', 'extraccion', 'muela',
      // Terapias
      'terapia', 'fisioterapia', 'rehabilitacion',
      'psicólogo', 'psicologo', 'psiquiatra', 'psicologia', 'terapia psicologica',
      // Exámenes
      'examen', 'laboratorio', 'analisis', 'radiografia', 'ecografia', 'resonancia',
      'tomografia', 'electrocardiograma', 'sangre', 'orina',
      // Procedimientos
      'cirugia', 'operacion', 'tratamiento', 'procedimiento', 'hospitalizacion',
      // Seguros
      'seguro', 'eps', 'salud', 'medicina prepagada', 'sanitas', 'sura', 'compensar'
    ]
  },
  { 
    name: 'Educación', 
    type: 'expense',
    icon: '📚',
    description: 'Estudios, cursos y material educativo',
    keywords: [
      // Libros y material
      'libro', 'libros', 'libreria', 'texto', 'manual', 'guia',
      'panamericana', 'nacional', 'lerner',
      // Cursos y capacitación
      'curso', 'clase', 'taller', 'seminario', 'capacitacion', 'certificacion',
      'diplomado', 'especializacion', 'bootcamp',
      // Instituciones
      'universidad', 'u', 'colegio', 'escuela', 'instituto', 'academia',
      'jardin', 'guarderia', 'preescolar',
      // Pagos educativos
      'matrícula', 'matricula', 'pension', 'mensualidad', 'colegiatura',
      'inscripcion', 'derecho de grado',
      // Programas académicos
      'estudio', 'carrera', 'pregrado', 'maestria', 'posgrado', 'doctorado',
      'tecnico', 'tecnologo', 'profesional',
      // Plataformas online
      'udemy', 'coursera', 'platzi', 'domestika', 'linkedin learning',
      'edx', 'skillshare', 'crehana',
      // Útiles escolares
      'cuaderno', 'lapiz', 'esfero', 'marcador', 'colores', 'tijeras',
      'utiles', 'papeleria', 'fotocopias', 'impresiones', 'anillado',
      'mochila', 'lonchera', 'uniforme'
    ]
  },
  { 
    name: 'Servicios', 
    type: 'expense',
    icon: '🏠',
    description: 'Servicios públicos, vivienda y cuidado personal',
    keywords: [
      // Servicios públicos
      'luz', 'energia', 'electricidad', 'epm', 'codensa', 'enel', 'air-e',
      'agua', 'acueducto', 'alcantarillado', 'aseo',
      'gas', 'gas natural', 'gasodomestico', 'pipeta',
      // Telecomunicaciones
      'internet', 'wifi', 'fibra', 'banda ancha',
      'teléfono', 'telefono', 'celular', 'movil', 'plan', 'recarga', 'saldo',
      'minutos', 'datos', 'gigas',
      'claro', 'movistar', 'tigo', 'wom', 'virgin',
      'cable', 'tv', 'television', 'directv', 'claro video',
      // Vivienda
      'arriendo', 'alquiler', 'renta', 'canon', 'arrendamiento',
      'administracion', 'cuota de administracion', 'conjunto', 'edificio',
      'hipoteca', 'credito vivienda', 'cuota',
      // Cuidado personal (pueden ser gastos hormiga)
      'peluqueria', 'barberia', 'salon', 'corte', 'tinte', 'peinado',
      'manicure', 'pedicure', 'uñas', 'spa', 'masaje', 'facial',
      'depilacion', 'cera', 'laser',
      // Gimnasio y deporte
      'gimnasio', 'gym', 'crossfit', 'yoga', 'pilates', 'spinning',
      'bodytech', 'smartfit', 'hard body',
      // Limpieza y mantenimiento
      'lavanderia', 'tintoreria', 'lavado', 'planchado', 'lavado en seco',
      'limpieza', 'aseo', 'empleada', 'servicio domestico', 'señora del aseo',
      'mantenimiento', 'reparacion', 'arreglo', 'tecnico', 'plomero',
      'electricista', 'cerrajero', 'pintor', 'albanil',
      // Seguros y bancarios
      'seguro', 'poliza', 'soat', 'seguro de vida', 'seguro hogar',
      'banco', 'comision', 'cuota de manejo', 'transferencia', 'retiro',
      'cajero', 'tarjeta', 'anualidad'
    ]
  }
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
