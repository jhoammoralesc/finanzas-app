import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
}

interface DashboardState {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactions: any[];
  categoryData: CategoryData[];
  trendData: TrendData[];
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    transactions: [],
    categoryData: [],
    trendData: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simular datos para el dashboard
      const mockData: DashboardState = {
        balance: 2450000,
        monthlyIncome: 3500000,
        monthlyExpenses: 1050000,
        transactions: [],
        categoryData: [
          { name: 'Alimentación', value: 450000, color: '#FF6B6B' },
          { name: 'Transporte', value: 200000, color: '#4ECDC4' },
          { name: 'Entretenimiento', value: 150000, color: '#45B7D1' },
          { name: 'Servicios', value: 250000, color: '#96CEB4' },
        ],
        trendData: [
          { month: 'Ene', income: 3200000, expenses: 980000 },
          { month: 'Feb', income: 3400000, expenses: 1100000 },
          { month: 'Mar', income: 3500000, expenses: 1050000 },
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard Financiero</h1>
      
      {/* Tarjetas de resumen */}
      <div className="summary-cards">
        <div className="card balance">
          <h3>💰 Balance Total</h3>
          <p className="amount">${dashboardData.balance.toLocaleString()}</p>
        </div>
        
        <div className="card income">
          <h3>📈 Ingresos del Mes</h3>
          <p className="amount positive">${dashboardData.monthlyIncome.toLocaleString()}</p>
        </div>
        
        <div className="card expenses">
          <h3>📉 Gastos del Mes</h3>
          <p className="amount negative">${dashboardData.monthlyExpenses.toLocaleString()}</p>
        </div>

        <div className="card savings">
          <h3>💎 Ahorro del Mes</h3>
          <p className="amount positive">
            ${(dashboardData.monthlyIncome - dashboardData.monthlyExpenses).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dashboardData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Tendencia Mensual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Line type="monotone" dataKey="income" stroke="#4ECDC4" strokeWidth={2} name="Ingresos" />
              <Line type="monotone" dataKey="expenses" stroke="#FF6B6B" strokeWidth={2} name="Gastos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights rápidos */}
      <div className="insights-section">
        <h3>💡 Insights Rápidos</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>🎯 Meta de Ahorro</h4>
            <p>Vas por buen camino. Has ahorrado 70% de tu meta mensual.</p>
          </div>
          
          <div className="insight-card warning">
            <h4>⚠️ Gastos Elevados</h4>
            <p>Tus gastos en alimentación aumentaron 15% este mes.</p>
          </div>
          
          <div className="insight-card success">
            <h4>✅ Buen Control</h4>
            <p>Mantuviste el presupuesto de transporte bajo control.</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Quick Actions */}
      <div className="whatsapp-section">
        <h3>📱 Registro Rápido por WhatsApp</h3>
        <p>Envía mensajes como:</p>
        <div className="whatsapp-examples">
          <code>"Gasté 25000 en almuerzo"</code>
          <code>"Recibí 500000 por freelance"</code>
          <code>"Saldo"</code>
          <code>"Reporte del mes"</code>
        </div>
        <p>📞 WhatsApp: <strong>+57 XXX XXX XXXX</strong></p>
      </div>
    </div>
  );
};

export default Dashboard;
