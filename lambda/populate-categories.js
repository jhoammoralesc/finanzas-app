const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const DEFAULT_CATEGORIES = [
  { 
    name: 'Alimentación', 
    type: 'expense',
    icon: '🍔',
    description: 'Comidas, snacks, bebidas y supermercado',
    keywords: ['comida', 'almuerzo', 'cena', 'desayuno', 'brunch', 'merienda', 'restaurante', 'cafeteria', 'fonda', 'panaderia', 'mercado', 'supermercado', 'tienda', 'minimercado', 'exito', 'carulla', 'olimpica', 'pizza', 'hamburguesa', 'pollo', 'perro', 'hotdog', 'empanada', 'arepa', 'tacos', 'burrito', 'wrap', 'sanduche', 'sandwich', 'sub', 'subway', 'mcdonalds', 'burger king', 'kfc', 'dominos', 'papa johns', 'helado', 'helados', 'dulce', 'postre', 'snack', 'galletas', 'chocolate', 'chicle', 'caramelo', 'golosina', 'chupete', 'bombom', 'torta', 'pastel', 'café', 'cafeteria', 'starbucks', 'juan valdez', 'oma', 'tostao', 'bebida', 'refresco', 'gaseosa', 'coca cola', 'pepsi', 'jugo', 'agua', 'te', 'smoothie', 'sushi', 'pasta', 'arroz', 'sopa', 'caldo', 'bandeja', 'corrientazo', 'carne', 'pollo', 'pescado', 'mariscos', 'frutas', 'verduras', 'vegetales', 'pan', 'huevos', 'lacteos', 'leche', 'queso', 'yogurt', 'mantequilla', 'cereal', 'avena', 'granola', 'aceite', 'sal', 'azucar', 'condimentos', 'cerveza', 'vino', 'licor', 'trago', 'whisky', 'ron', 'vodka', 'tequila', 'aguardiente', 'bar', 'cantina']
  },
  { 
    name: 'Transporte', 
    type: 'expense',
    icon: '🚗',
    description: 'Movilidad, combustible y estacionamiento',
    keywords: ['taxi', 'uber', 'didi', 'cabify', 'beat', 'indriver', 'picap', 'gasolina', 'combustible', 'tanqueo', 'tanqueada', 'acpm', 'diesel', 'terpel', 'mobil', 'esso', 'petrobras', 'bus', 'buseta', 'colectivo', 'metro', 'transmilenio', 'sitp', 'mio', 'pasaje', 'transporte', 'recarga', 'tullave', 'civica', 'parqueadero', 'parqueo', 'estacionamiento', 'peaje', 'parquimetro', 'moto', 'bicicleta', 'bici', 'patineta', 'scooter', 'patinete', 'tren', 'avion', 'vuelo', 'aeropuerto', 'terminal', 'pasaje aereo', 'mecanico', 'taller', 'cambio aceite', 'llantas', 'frenos', 'bateria', 'lavado', 'lavadero', 'alineacion', 'balanceo', 'revision tecnicomecanica']
  },
  { 
    name: 'Entretenimiento', 
    type: 'expense',
    icon: '🎮',
    description: 'Ocio, streaming, salidas y diversión',
    keywords: ['netflix', 'spotify', 'prime', 'amazon prime', 'hbo', 'hbo max', 'disney', 'disney plus', 'youtube', 'youtube premium', 'twitch', 'crunchyroll', 'paramount', 'star plus', 'apple music', 'deezer', 'tidal', 'suscripcion', 'membresia', 'cine', 'pelicula', 'cinemark', 'procinal', 'cinepolis', 'royal films', 'teatro', 'obra', 'funcion', 'concierto', 'show', 'evento', 'festival', 'feria', 'boleta', 'entrada', 'bar', 'discoteca', 'club', 'fiesta', 'rumba', 'parranda', 'antro', 'parque', 'diversiones', 'feria', 'circo', 'zoologico', 'acuario', 'museo', 'exposicion', 'galeria', 'planetario', 'salida', 'paseo', 'plan', 'actividad', 'tour', 'excursion', 'juego', 'videojuego', 'xbox', 'playstation', 'ps5', 'ps4', 'nintendo', 'switch', 'steam', 'epic', 'epic games', 'fortnite', 'lol', 'valorant', 'fifa', 'gta', 'skin', 'battle pass', 'pavos', 'robux', 'minecraft', 'casino', 'apuesta', 'loteria', 'chance', 'baloto', 'poker', 'ruleta', 'betplay', 'codere', 'wplay']
  },
  { 
    name: 'Salud', 
    type: 'expense',
    icon: '⚕️',
    description: 'Medicina, consultas y cuidado médico',
    keywords: ['farmacia', 'drogueria', 'cruz verde', 'cafam', 'colsubsidio', 'medicina', 'medicamento', 'droga', 'pastilla', 'jarabe', 'capsula', 'vitamina', 'suplemento', 'proteina', 'creatina', 'antibiotico', 'analgesico', 'ibuprofeno', 'acetaminofen', 'dolex', 'doctor', 'medico', 'consulta', 'cita', 'control', 'chequeo', 'especialista', 'pediatra', 'ginecologo', 'cardiologo', 'dermatologo', 'hospital', 'clinica', 'centro medico', 'ips', 'urgencias', 'emergencia', 'dentista', 'odontologo', 'ortodoncia', 'brackets', 'limpieza dental', 'calza', 'extraccion', 'muela', 'terapia', 'fisioterapia', 'rehabilitacion', 'psicólogo', 'psicologo', 'psiquiatra', 'psicologia', 'terapia psicologica', 'examen', 'laboratorio', 'analisis', 'radiografia', 'ecografia', 'resonancia', 'tomografia', 'electrocardiograma', 'sangre', 'orina', 'cirugia', 'operacion', 'tratamiento', 'procedimiento', 'hospitalizacion', 'seguro', 'eps', 'salud', 'medicina prepagada', 'sanitas', 'sura', 'compensar']
  },
  { 
    name: 'Educación', 
    type: 'expense',
    icon: '📚',
    description: 'Estudios, cursos y material educativo',
    keywords: ['libro', 'libros', 'libreria', 'texto', 'manual', 'guia', 'panamericana', 'nacional', 'lerner', 'curso', 'clase', 'taller', 'seminario', 'capacitacion', 'certificacion', 'diplomado', 'especializacion', 'bootcamp', 'universidad', 'u', 'colegio', 'escuela', 'instituto', 'academia', 'jardin', 'guarderia', 'preescolar', 'matrícula', 'matricula', 'pension', 'mensualidad', 'colegiatura', 'inscripcion', 'derecho de grado', 'estudio', 'carrera', 'pregrado', 'maestria', 'posgrado', 'doctorado', 'tecnico', 'tecnologo', 'profesional', 'udemy', 'coursera', 'platzi', 'domestika', 'linkedin learning', 'edx', 'skillshare', 'crehana', 'cuaderno', 'lapiz', 'esfero', 'marcador', 'colores', 'tijeras', 'utiles', 'papeleria', 'fotocopias', 'impresiones', 'anillado', 'mochila', 'lonchera', 'uniforme']
  },
  { 
    name: 'Servicios', 
    type: 'expense',
    icon: '🏠',
    description: 'Servicios públicos, vivienda y cuidado personal',
    keywords: ['luz', 'energia', 'electricidad', 'epm', 'codensa', 'enel', 'air-e', 'agua', 'acueducto', 'alcantarillado', 'aseo', 'gas', 'gas natural', 'gasodomestico', 'pipeta', 'internet', 'wifi', 'fibra', 'banda ancha', 'teléfono', 'telefono', 'celular', 'movil', 'plan', 'recarga', 'saldo', 'minutos', 'datos', 'gigas', 'claro', 'movistar', 'tigo', 'wom', 'virgin', 'cable', 'tv', 'television', 'directv', 'claro video', 'arriendo', 'alquiler', 'renta', 'canon', 'arrendamiento', 'administracion', 'cuota de administracion', 'conjunto', 'edificio', 'hipoteca', 'credito vivienda', 'cuota', 'peluqueria', 'barberia', 'salon', 'corte', 'tinte', 'peinado', 'manicure', 'pedicure', 'uñas', 'spa', 'masaje', 'facial', 'depilacion', 'cera', 'laser', 'gimnasio', 'gym', 'crossfit', 'yoga', 'pilates', 'spinning', 'bodytech', 'smartfit', 'hard body', 'lavanderia', 'tintoreria', 'lavado', 'planchado', 'lavado en seco', 'limpieza', 'aseo', 'empleada', 'servicio domestico', 'señora del aseo', 'mantenimiento', 'reparacion', 'arreglo', 'tecnico', 'plomero', 'electricista', 'cerrajero', 'pintor', 'albanil', 'seguro', 'poliza', 'soat', 'seguro de vida', 'seguro hogar', 'banco', 'comision', 'cuota de manejo', 'transferencia', 'retiro', 'cajero', 'tarjeta', 'anualidad']
  }
];

(async () => {
  console.log('🚀 Populating default categories in DynamoDB...\n');
  
  for (const cat of DEFAULT_CATEGORIES) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'finanzas-categories',
        Item: {
          userId: 'DEFAULT',
          categoryId: cat.name,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          description: cat.description,
          keywords: cat.keywords,
          createdAt: new Date().toISOString()
        }
      }));
      console.log(`✅ ${cat.icon} ${cat.name} (${cat.keywords.length} keywords)`);
    } catch (error) {
      console.error(`❌ Error with ${cat.name}:`, error.message);
    }
  }
  
  console.log('\n✨ Done! All categories populated.');
})();
