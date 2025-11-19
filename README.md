# 💰 FinanzasApp - Gestión Financiera Personal 🚀

Una aplicación completa de gestión financiera personal con integración de WhatsApp Bot, análisis inteligente y reportes detallados.

**🌐 Nueva URL con Auto-Deploy**: https://d2lrwv7cxtby1n.amplifyapp.com

## ✅ Auto-Deploy Configurado
Cada push a main despliega automáticamente usando GitHub Actions.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Dashboard Interactivo**: Visualización completa de tu situación financiera
- **Bot de WhatsApp**: Registra transacciones enviando mensajes simples
- **Análisis Inteligente**: Detecta patrones de gasto y gastos hormiga
- **Presupuestos**: Control y seguimiento de presupuestos por categoría
- **Reportes Avanzados**: Insights y recomendaciones personalizadas
- **Metas Financieras**: Seguimiento de objetivos de ahorro

### 🤖 Comandos del Bot de WhatsApp
```
"Gasté 25000 en almuerzo"          → Registra gasto
"Recibí 500000 por freelance"      → Registra ingreso  
"Saldo"                            → Consulta balance
"Reporte del mes"                  → Genera reporte
"Presupuesto"                      → Estado del presupuesto
```

### 📊 Análisis Automático
- Detección de gastos hormiga
- Patrones de consumo por días/horarios
- Recomendaciones de ahorro personalizadas
- Proyecciones financieras
- Alertas de presupuesto

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **AWS Amplify UI** para autenticación
- **Recharts** para visualizaciones
- **React Router** para navegación

### Backend (AWS)
- **AWS Amplify Gen 2** - Infraestructura como código
- **Amazon Cognito** - Autenticación y autorización
- **AWS Lambda** - Procesamiento serverless
- **Amazon DynamoDB** - Base de datos NoSQL
- **AWS AppSync** - API GraphQL
- **Amazon API Gateway** - APIs REST

### Integración WhatsApp
- **WhatsApp Business API** - Bot conversacional
- **Procesamiento NLP** - Extracción de datos de mensajes
- **Webhooks** - Comunicación en tiempo real

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   AWS Amplify    │    │   WhatsApp      │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   Business API  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   AWS Services   │
                    │                  │
                    │ • Cognito        │
                    │ • Lambda         │
                    │ • DynamoDB       │
                    │ • AppSync        │
                    │ • API Gateway    │
                    └──────────────────┘
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- AWS CLI configurado
- Cuenta AWS con permisos de Amplify

### 1. Clonar e Instalar
```bash
git clone <repository-url>
cd finanzas
npm install
```

### 2. Desarrollo Local
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### 3. Despliegue en AWS

#### Opción A: Amplify Hosting (Recomendado)
1. Sube el código a GitHub/GitLab
2. Ve a AWS Amplify Console
3. Conecta tu repositorio
4. Configura las variables de entorno
5. Despliega automáticamente

#### Opción B: Amplify CLI
```bash
# Configurar Amplify
AWS_PROFILE=lui-dev npx ampx sandbox

# Desplegar
npm run deploy
```

## 📱 Configuración del Bot de WhatsApp

### 1. Crear Aplicación en Meta for Developers
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una nueva aplicación
3. Agrega el producto "WhatsApp Business"
4. Configura el webhook endpoint

### 2. Configurar Webhook
```bash
# URL del webhook (después del despliegue)
https://your-api-gateway-url/whatsapp-webhook

# Verify Token (configurable)
your-verify-token-here
```

### 3. Variables de Entorno
```env
WHATSAPP_TOKEN=your-whatsapp-access-token
VERIFY_TOKEN=your-verify-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

## 💰 Costos AWS (Tier Gratuito)

### Servicios Incluidos en Free Tier
- **Amplify Hosting**: 1000 build minutes, 5GB storage, 15GB transfer
- **Lambda**: 1M requests/mes, 400,000 GB-segundos
- **DynamoDB**: 25GB storage, 25 RCU/WCU  
- **Cognito**: 50,000 MAU
- **API Gateway**: 1M requests/mes

### Estimación de Costos Post Free-Tier
- **Uso básico (< 1000 usuarios)**: $5-15/mes
- **Uso medio (1000-5000 usuarios)**: $15-50/mes
- **Uso alto (5000+ usuarios)**: $50+/mes

## 📊 Estructura de Datos

### Modelos Principales
```typescript
User {
  id, email, phone, firstName, lastName
  whatsappNumber, monthlyIncome, currency
}

Transaction {
  userId, amount, type, category, description
  date, source, isRecurring, tags
}

Budget {
  userId, categoryId, amount, period
  startDate, endDate, spent, isActive
}

FinancialGoal {
  userId, name, targetAmount, currentAmount
  targetDate, priority, isCompleted
}
```

## 🔧 Configuración Avanzada

### Categorías Personalizadas
```javascript
const categories = {
  EXPENSE: ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios'],
  INCOME: ['Salario', 'Freelance', 'Inversiones', 'Ventas']
};
```

### Patrones de Reconocimiento NLP
```javascript
const patterns = {
  expense: /(?:gast[eé]|compr[eé]|pagu[eé])\s*(\d+)/i,
  income: /(?:recib[íi]|ingres[oó]|gan[eé])\s*(\d+)/i,
  balance: /(?:saldo|balance|cuanto tengo)/i
};
```

## 🚀 Roadmap

### Fase 1 (Actual)
- ✅ Dashboard básico
- ✅ Gestión de transacciones
- ✅ Bot de WhatsApp
- ✅ Análisis básico

### Fase 2 (Próxima)
- 🔄 Integración bancaria (Open Banking)
- 🔄 Notificaciones push
- 🔄 Exportación de datos
- 🔄 Modo offline

### Fase 3 (Futuro)
- 📋 Inversiones y portafolio
- 📋 Planificación de jubilación
- 📋 Análisis predictivo con ML
- 📋 App móvil nativa

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Email**: support@finanzasapp.com
- **WhatsApp**: +57 XXX XXX XXXX
- **Documentación**: [docs.finanzasapp.com](https://docs.finanzasapp.com)

---

**Desarrollado con ❤️ para mejorar tu salud financiera**
