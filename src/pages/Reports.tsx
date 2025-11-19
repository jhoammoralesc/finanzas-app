import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  
  const monthlyData = [
    { month: 'Ene', gastos: 980000, ingresos: 3200000, ahorro: 2220000 },
    { month: 'Feb', gastos: 1100000, ingresos: 3400000, ahorro: 2300000 },
    { month: 'Mar', gastos: 1050000, ingresos: 3500000, ahorro: 2450000 },
  ];

  const categoryAnalysis = [
    { category: 'Alimentación', amount: 450000, percentage: 43, trend: '+15%' },
    { category: 'Transporte', amount: 200000, percentage: 19, trend: '-5%' },
    { category: 'Servicios', amount: 250000, percentage: 24, trend: '+2%' },
    { category: 'Entretenimiento', amount: 150000, percentage: 14, trend: '+8%' },
  ];

  const insights = [
    {
      type: 'warning',
      title: 'Gastos Hormiga Detectados',
      description: 'Has gastado $45,000 en compras menores a $10,000. Considera revisar estos gastos.',
      impact: 'Alto'
    },
    {
      type: 'success',
      title: 'Meta de Ahorro Cumplida',
      description: 'Superaste tu meta de ahorro mensual en un 15%. ¡Excelente trabajo!',
      impact: 'Positivo'
    },
    {
      type: 'info',
      title: 'Patrón de Gastos',
      description: 'Gastas 40% más los fines de semana. Planifica mejor estos días.',
      impact: 'Medio'
    }
  ];

  return (
    <div className="reports">
      <div className="page-header">
        <h1>📈 Reportes Financieros</h1>
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="period-selector"
        >
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="executive-summary">
        <h3>📊 Resumen Ejecutivo - Marzo 2024</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <h4>💰 Balance Neto</h4>
            <p className="amount positive">+$2,450,000</p>
            <span className="change positive">↗ +12% vs mes anterior</span>
          </div>
          
          <div className="summary-card">
            <h4>📈 Tasa de Ahorro</h4>
            <p className="amount">70%</p>
            <span className="change positive">↗ +5% vs mes anterior</span>
          </div>
          
          <div className="summary-card">
            <h4>🎯 Cumplimiento Presupuesto</h4>
            <p className="amount">85%</p>
            <span className="change neutral">→ Estable</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencias */}
      <div className="chart-section">
        <h3>📈 Tendencia de Ingresos vs Gastos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Line type="monotone" dataKey="ingresos" stroke="#4ECDC4" strokeWidth={3} name="Ingresos" />
            <Line type="monotone" dataKey="gastos" stroke="#FF6B6B" strokeWidth={3} name="Gastos" />
            <Line type="monotone" dataKey="ahorro" stroke="#96CEB4" strokeWidth={3} name="Ahorro" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Análisis por Categorías */}
      <div className="category-analysis">
        <h3>🏷️ Análisis por Categorías</h3>
        <div className="category-table">
          <div className="table-header">
            <span>Categoría</span>
            <span>Monto</span>
            <span>% del Total</span>
            <span>Tendencia</span>
          </div>
          
          {categoryAnalysis.map((item, index) => (
            <div key={index} className="table-row">
              <span className="category-name">{item.category}</span>
              <span className="amount">${item.amount.toLocaleString()}</span>
              <span className="percentage">{item.percentage}%</span>
              <span className={`trend ${item.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                {item.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights y Recomendaciones */}
      <div className="insights-section">
        <h3>💡 Insights y Recomendaciones</h3>
        <div className="insights-grid">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <h4>{insight.title}</h4>
                <span className={`impact ${insight.impact.toLowerCase()}`}>
                  {insight.impact}
                </span>
              </div>
              <p>{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Proyecciones */}
      <div className="projections">
        <h3>🔮 Proyecciones</h3>
        <div className="projection-cards">
          <div className="projection-card">
            <h4>Ahorro Proyectado (6 meses)</h4>
            <p className="projection-amount">$14,700,000</p>
            <span className="projection-note">Basado en tendencia actual</span>
          </div>
          
          <div className="projection-card">
            <h4>Meta Anual de Ahorro</h4>
            <p className="projection-amount">85% completado</p>
            <span className="projection-note">Vas adelantado 2 meses</span>
          </div>
        </div>
      </div>

      {/* Acciones Recomendadas */}
      <div className="recommended-actions">
        <h3>🎯 Acciones Recomendadas</h3>
        <div className="actions-list">
          <div className="action-item priority-high">
            <span className="priority">Alta</span>
            <div className="action-content">
              <h4>Reducir Gastos Hormiga</h4>
              <p>Implementa la regla de esperar 24h antes de compras menores a $20,000</p>
              <span className="potential-saving">Ahorro potencial: $180,000/mes</span>
            </div>
          </div>
          
          <div className="action-item priority-medium">
            <span className="priority">Media</span>
            <div className="action-content">
              <h4>Optimizar Gastos de Alimentación</h4>
              <p>Planifica menús semanales y compra por listas</p>
              <span className="potential-saving">Ahorro potencial: $120,000/mes</span>
            </div>
          </div>
          
          <div className="action-item priority-low">
            <span className="priority">Baja</span>
            <div className="action-content">
              <h4>Revisar Suscripciones</h4>
              <p>Cancela servicios que no uses frecuentemente</p>
              <span className="potential-saving">Ahorro potencial: $45,000/mes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
