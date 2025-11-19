import { useState, useEffect } from 'react';

const Budget = () => {
  const [budgets, setBudgets] = useState([
    { id: 1, category: 'Alimentación', budgeted: 300000, spent: 245000 },
    { id: 2, category: 'Transporte', budgeted: 150000, spent: 120000 },
    { id: 3, category: 'Entretenimiento', budgeted: 100000, spent: 85000 },
  ]);

  const getProgressPercentage = (spent: number, budgeted: number) => {
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return '#4ECDC4';
    if (percentage < 90) return '#FFD93D';
    return '#FF6B6B';
  };

  return (
    <div className="budget">
      <h1>🎯 Presupuesto</h1>
      
      <div className="budget-overview">
        <div className="budget-summary">
          <h3>Resumen del Mes</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="label">Presupuesto Total:</span>
              <span className="value">${budgets.reduce((sum, b) => sum + b.budgeted, 0).toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Gastado:</span>
              <span className="value">${budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Disponible:</span>
              <span className="value positive">
                ${budgets.reduce((sum, b) => sum + (b.budgeted - b.spent), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="budget-categories">
        <h3>Presupuesto por Categoría</h3>
        
        {budgets.map((budget) => {
          const percentage = getProgressPercentage(budget.spent, budget.budgeted);
          const remaining = budget.budgeted - budget.spent;
          
          return (
            <div key={budget.id} className="budget-item">
              <div className="budget-header">
                <h4>{budget.category}</h4>
                <div className="budget-amounts">
                  <span className="spent">${budget.spent.toLocaleString()}</span>
                  <span className="separator">/</span>
                  <span className="budgeted">${budget.budgeted.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getProgressColor(percentage)
                  }}
                />
              </div>
              
              <div className="budget-details">
                <span className="percentage">{percentage.toFixed(1)}% usado</span>
                <span className={`remaining ${remaining < 0 ? 'negative' : 'positive'}`}>
                  {remaining >= 0 ? 'Quedan' : 'Excedido'} ${Math.abs(remaining).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="budget-recommendations">
        <h3>💡 Recomendaciones</h3>
        <div className="recommendations-list">
          <div className="recommendation success">
            <span className="icon">✅</span>
            <p>Excelente control en transporte. Tienes $30,000 disponibles para otros gastos.</p>
          </div>
          
          <div className="recommendation warning">
            <span className="icon">⚠️</span>
            <p>Cuidado con alimentación. Ya usaste 82% del presupuesto y faltan 10 días del mes.</p>
          </div>
          
          <div className="recommendation info">
            <span className="icon">💡</span>
            <p>Considera aumentar el presupuesto de entretenimiento en $50,000 para el próximo mes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
