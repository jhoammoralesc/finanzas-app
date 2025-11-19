import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';

const Dashboard = () => {
  const { transactions, budgets } = useData();

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Datos para gráfico de gastos por categoría
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // Datos para gráfico de presupuestos
  const budgetData = budgets.map(budget => ({
    category: budget.category,
    presupuesto: budget.amount,
    gastado: budget.spent,
    disponible: budget.amount - budget.spent
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>📊 Dashboard Financiero</h1>
        <p>Resumen de tu situación financiera actual</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Ingresos Totales</h3>
            <p className="amount">${totalIncome.toLocaleString()}</p>
            <span className="trend positive">+12% vs mes anterior</span>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Gastos Totales</h3>
            <p className="amount">${totalExpenses.toLocaleString()}</p>
            <span className="trend negative">+5% vs mes anterior</span>
          </div>
        </div>

        <div className="summary-card balance">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Balance</h3>
            <p className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
              ${balance.toLocaleString()}
            </p>
            <span className={`trend ${balance >= 0 ? 'positive' : 'negative'}`}>
              {balance >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
        </div>

        <div className="summary-card savings">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Tasa de Ahorro</h3>
            <p className="amount">{totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%</p>
            <span className="trend positive">Meta: 20%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3>Gastos por Categoría</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
              <p>No hay gastos registrados</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>Presupuestos vs Gastos</h3>
          {budgetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="presupuesto" fill="#8884d8" name="Presupuesto" />
                <Bar dataKey="gastado" fill="#82ca9d" name="Gastado" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
              <p>No hay presupuestos configurados</p>
            </div>
          )}
        </div>

        <div className="recent-transactions">
          <h3>Transacciones Recientes</h3>
          {recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <span className="description">{transaction.description}</span>
                    <span className="category">{transaction.category}</span>
                  </div>
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay transacciones recientes</p>
            </div>
          )}
        </div>

        <div className="budget-alerts">
          <h3>Alertas de Presupuesto</h3>
          <div className="alerts-list">
            {budgets.map(budget => {
              const percentage = (budget.spent / budget.amount) * 100;
              const alertLevel = percentage >= 90 ? 'danger' : percentage >= 70 ? 'warning' : 'safe';
              
              return (
                <div key={budget.id} className={`alert-item ${alertLevel}`}>
                  <div className="alert-info">
                    <span className="category">{budget.category}</span>
                    <span className="percentage">{percentage.toFixed(0)}% usado</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${alertLevel}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {budgets.length === 0 && (
              <div className="empty-state">
                <p>No hay presupuestos configurados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
