import { useState } from 'react';
import { useData } from '../context/DataContext';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction } = useData();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Educación', 'Salario', 'Otros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount && formData.description && formData.category) {
      addTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        type: formData.type,
        date: formData.date
      });
      setFormData({
        amount: '',
        description: '',
        category: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      deleteTransaction(id);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="transactions">
      <div className="page-header">
        <h1>💳 Transacciones</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nueva Transacción'}
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <h3>Ingresos</h3>
          <p className="amount">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="summary-card expense">
          <h3>Gastos</h3>
          <p className="amount">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="summary-card balance">
          <h3>Balance</h3>
          <p className="amount">${(totalIncome - totalExpenses).toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <div className="transaction-form">
          <h3>Nueva Transacción</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción de la transacción"
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="transactions-list">
        <h3>Historial de Transacciones</h3>
        {transactions.length === 0 ? (
          <p className="empty-state">No hay transacciones registradas</p>
        ) : (
          <div className="transactions-table">
            {transactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-info">
                  <div className="transaction-main">
                    <span className="description">{transaction.description}</span>
                    <span className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <span className="category">{transaction.category}</span>
                    <span className="date">{new Date(transaction.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(transaction.id)}
                  title="Eliminar transacción"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
