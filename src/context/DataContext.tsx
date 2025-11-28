import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_ENDPOINT = 'https://d5b928o88l.execute-api.us-east-2.amazonaws.com/prod';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  userId: string;
  source?: 'manual' | 'telegram' | 'whatsapp';
  createdAt?: string;
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
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'spent'>) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  const getAuthToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  };

  const fetchTransactions = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_ENDPOINT}/transactions`, {
        headers: { 'Authorization': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_ENDPOINT}/budgets`, {
        headers: { 'Authorization': token || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchBudgets()]);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_ENDPOINT}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      });
      
      if (response.ok) {
        const newTransaction = await response.json();
        setTransactions(prev => [newTransaction, ...prev]);
        
        if (transaction.type === 'expense') {
          setBudgets(prev => prev.map(budget => 
            budget.category === transaction.category 
              ? { ...budget, spent: budget.spent + transaction.amount }
              : budget
          ));
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
    ));
  };

  const deleteTransaction = async (id: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_ENDPOINT}/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });
      
      if (response.ok) {
        const transaction = transactions.find(t => t.id === id);
        if (transaction && transaction.type === 'expense') {
          setBudgets(prev => prev.map(budget => 
            budget.category === transaction.category 
              ? { ...budget, spent: Math.max(0, budget.spent - transaction.amount) }
              : budget
          ));
        }
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'spent'>) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_ENDPOINT}/budgets`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      });
      
      if (response.ok) {
        const newBudget = await response.json();
        setBudgets(prev => [...prev, newBudget]);
      }
    } catch (error) {
      console.error('Error adding budget:', error);
    }
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
      loading,
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
