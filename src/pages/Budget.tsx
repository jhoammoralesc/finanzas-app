import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = 'https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod';

interface Budget {
  budgetId: string;
  category: string;
  amount: number;
  spent: number;
}

const Budget = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState({ category: '', amount: '' });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch(`${API_URL}/budgets`, {
        headers: { 'Authorization': token || '' }
      });

      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: newBudget.category,
          amount: Number(newBudget.amount),
          period: 'monthly'
        })
      });

      if (response.ok) {
        setNewBudget({ category: '', amount: '' });
        setShowForm(false);
        loadBudgets();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const updateBudget = async (budgetId: string, newAmount: number) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: newAmount })
      });

      if (response.ok) {
        setEditingBudget(null);
        loadBudgets();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });

      if (response.ok) {
        loadBudgets();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const getProgressPercentage = (spent: number, budgeted: number) => {
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return '#4ECDC4';
    if (percentage < 90) return '#FFD93D';
    return '#FF6B6B';
  };

  if (loading) {
    return <div className="budget"><h1>Cargando presupuestos...</h1></div>;
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="budget">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🎯 Presupuesto</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo Presupuesto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createBudget} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label>Categoría</label>
              <select 
                value={newBudget.category}
                onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Seleccionar...</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Transporte">Transporte</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Servicios">Servicios</option>
              </select>
            </div>
            <div>
              <label>Monto Mensual</label>
              <input
                type="number"
                value={newBudget.amount}
                onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                placeholder="0"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>
      )}
      
      <div className="budget-overview">
        <div className="budget-summary">
          <h3>Resumen del Mes</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="label">Presupuesto Total:</span>
              <span className="value">${totalBudgeted.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Gastado:</span>
              <span className="value">${totalSpent.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Disponible:</span>
              <span className={`value ${totalRemaining >= 0 ? 'positive' : 'negative'}`}>
                ${Math.abs(totalRemaining).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="budget-categories">
        <h3>Presupuesto por Categoría</h3>
        
        {budgets.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No tienes presupuestos configurados. Crea uno para empezar a controlar tus gastos.
          </p>
        ) : (
          budgets.map((budget) => {
            const percentage = getProgressPercentage(budget.spent, budget.amount);
            const remaining = budget.amount - budget.spent;
            const isEditing = editingBudget === budget.budgetId;
            
            return (
              <div key={budget.budgetId} className="budget-item">
                <div className="budget-header">
                  <h4>{budget.category}</h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          defaultValue={budget.amount}
                          id={`edit-${budget.budgetId}`}
                          style={{ width: '120px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById(`edit-${budget.budgetId}`) as HTMLInputElement;
                            updateBudget(budget.budgetId, Number(input.value));
                          }}
                          style={{ background: '#4ECDC4', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => setEditingBudget(null)}
                          style={{ background: '#ccc', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="budget-amounts">
                          <span className="spent">${budget.spent.toLocaleString()}</span>
                          <span className="separator">/</span>
                          <span className="budgeted">${budget.amount.toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => setEditingBudget(budget.budgetId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => deleteBudget(budget.budgetId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </>
                    )}
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
                  <span className="percentage">{percentage}% usado</span>
                  <span className={`remaining ${remaining < 0 ? 'negative' : 'positive'}`}>
                    {remaining >= 0 ? 'Quedan' : 'Excedido'} ${Math.abs(remaining).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Budget;
