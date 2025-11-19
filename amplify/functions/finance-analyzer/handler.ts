import type { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { userId, analysisType, period } = JSON.parse(event.body || '{}');

    switch (analysisType) {
      case 'spending_patterns':
        return await analyzeSpendingPatterns(userId, period);
      case 'budget_analysis':
        return await analyzeBudgetPerformance(userId, period);
      case 'savings_opportunities':
        return await findSavingsOpportunities(userId, period);
      case 'financial_health':
        return await assessFinancialHealth(userId);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid analysis type' }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function analyzeSpendingPatterns(userId: string, period: string) {
  // Análisis de patrones de gasto
  const analysis = {
    totalSpent: 0,
    categoryBreakdown: {},
    trends: [],
    insights: [
      'Tus gastos en alimentación han aumentado 15% este mes',
      'Los fines de semana gastas 40% más que entre semana',
      'Tienes gastos hormiga de $45,000 en promedio semanal'
    ],
    recommendations: [
      'Establece un presupuesto semanal de $200,000 para alimentación',
      'Considera preparar comida en casa los fines de semana',
      'Revisa suscripciones que no uses: Netflix, Spotify duplicados'
    ]
  };

  return {
    statusCode: 200,
    body: JSON.stringify(analysis),
  };
}

async function analyzeBudgetPerformance(userId: string, period: string) {
  const analysis = {
    budgets: [
      {
        category: 'Alimentación',
        budgeted: 300000,
        spent: 345000,
        variance: -45000,
        status: 'over_budget'
      },
      {
        category: 'Transporte',
        budgeted: 150000,
        spent: 120000,
        variance: 30000,
        status: 'under_budget'
      }
    ],
    overallPerformance: 'needs_attention',
    suggestions: [
      'Reduce gastos en alimentación en $45,000',
      'El ahorro en transporte puede destinarse a emergencias'
    ]
  };

  return {
    statusCode: 200,
    body: JSON.stringify(analysis),
  };
}

async function findSavingsOpportunities(userId: string, period: string) {
  const opportunities = {
    immediate: [
      {
        category: 'Suscripciones',
        potential_savings: 25000,
        description: 'Cancela Netflix duplicado y Spotify premium no usado'
      },
      {
        category: 'Gastos hormiga',
        potential_savings: 60000,
        description: 'Reduce compras impulsivas en tiendas de conveniencia'
      }
    ],
    medium_term: [
      {
        category: 'Alimentación',
        potential_savings: 120000,
        description: 'Cocina en casa 3 días más por semana'
      }
    ],
    total_monthly_savings: 205000
  };

  return {
    statusCode: 200,
    body: JSON.stringify(opportunities),
  };
}

async function assessFinancialHealth(userId: string) {
  const assessment = {
    score: 72,
    level: 'good',
    factors: {
      savings_rate: { score: 65, status: 'needs_improvement' },
      debt_ratio: { score: 85, status: 'excellent' },
      emergency_fund: { score: 45, status: 'poor' },
      budget_adherence: { score: 78, status: 'good' }
    },
    priority_actions: [
      'Aumenta tu fondo de emergencia a 3 meses de gastos',
      'Mejora tu tasa de ahorro del 8% al 15%',
      'Mantén tu excelente manejo de deudas'
    ]
  };

  return {
    statusCode: 200,
    body: JSON.stringify(assessment),
  };
}
