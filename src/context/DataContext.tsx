import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  userId: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly';
  userId: string;
}

interface DataContextType {
  transactions: Transaction[];
  budgets: Budget[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'spent'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children, userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    // Load demo data
    const demoTransactions: Transaction[] = [
      {
        id: '1',
        amount: 3000,
        description: 'Salario',
        category: 'Salario',
        type: 'income',
        date: '2025-11-01',
        userId
      },
      {
        id: '2',
        amount: 500,
        description: 'Supermercado',
        category: 'Alimentación',
        type: 'expense',
        date: '2025-11-15',
        userId
      },
      {
        id: '3',
        amount: 200,
        description: 'Gasolina',
        category: 'Transporte',
        type: 'expense',
        date: '2025-11-18',
        userId
      }
    ];

    const demoBudgets: Budget[] = [
      {
        id: '1',
        category: 'Alimentación',
        amount: 800,
        spent: 500,
        period: 'monthly',
        userId
      },
      {
        id: '2',
        category: 'Transporte',
        amount: 400,
        spent: 200,
        period: 'monthly',
        userId
      }
    ];

    setTransactions(demoTransactions);
    setBudgets(demoBudgets);
  }, [userId]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      userId
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update budget spent amount
    if (transaction.type === 'expense') {
      setBudgets(prev => prev.map(budget => 
        budget.category === transaction.category 
          ? { ...budget, spent: budget.spent + transaction.amount }
          : budget
      ));
    }
  };

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
    ));
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction && transaction.type === 'expense') {
      setBudgets(prev => prev.map(budget => 
        budget.category === transaction.category 
          ? { ...budget, spent: Math.max(0, budget.spent - transaction.amount) }
          : budget
      ));
    }
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  const addBudget = (budget: Omit<Budget, 'id' | 'userId' | 'spent'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      spent: 0,
      userId
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, updatedBudget: Partial<Budget>) => {
    setBudgets(prev => prev.map(budget => 
      budget.id === id ? { ...budget, ...updatedBudget } : budget
    ));
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  return (
    <DataContext.Provider value={{
      transactions,
      budgets,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget
    }}>
      {children}
    </DataContext.Provider>
  );
};
