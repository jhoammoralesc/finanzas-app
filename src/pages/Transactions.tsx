import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'EXPENSE',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    EXPENSE: ['Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Salud', 'Educación', 'Otros'],
    INCOME: ['Salario', 'Freelance', 'Inversiones', 'Ventas', 'Otros']
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      // Simular carga de transacciones
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          amount: 25000,
          type: 'EXPENSE',
          category: 'Alimentación',
          description: 'Almuerzo restaurante',
          date: '2024-03-15'
        },
        {
          id: '2',
          amount: 500000,
          type: 'INCOME',
          category: 'Freelance',
          description: 'Proyecto web',
          date: '2024-03-14'
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        amount: parseFloat(formData.amount),
        type: formData.type as 'INCOME' | 'EXPENSE',
        category: formData.category,
        description: formData.description,
        date: formData.date,
      };

      setTransactions([newTransaction, ...transactions]);

      setFormData({
        amount: '',
        type: 'EXPENSE',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowForm(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando transacciones...</div>;
  }

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

      {showForm && (
        <div className="transaction-form">
          <h3>Nueva Transacción</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value, category: ''})}
                  required
                >
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories[formData.type as keyof typeof categories].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
            </div>

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

            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No hay transacciones registradas</p>
            <p>Agrega tu primera transacción o envía un mensaje por WhatsApp</p>
          </div>
        ) : (
          <div className="transactions-table">
            <div className="table-header">
              <span>Fecha</span>
              <span>Descripción</span>
              <span>Categoría</span>
              <span>Monto</span>
              <span>Acciones</span>
            </div>
            
            {transactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <span>{new Date(transaction.date).toLocaleDateString()}</span>
                <span>{transaction.description}</span>
                <span className="category">{transaction.category}</span>
                <span className={`amount ${transaction.type.toLowerCase()}`}>
                  {transaction.type === 'EXPENSE' ? '-' : '+'}
                  ${transaction.amount.toLocaleString()}
                </span>
                <span className="actions">
                  <button 
                    onClick={() => deleteTransaction(transaction.id)}
                    className="btn-delete"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
