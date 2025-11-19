export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  subcategory?: string;
  description: string;
  date: string;
  source: 'MANUAL' | 'WHATSAPP' | 'BANK_IMPORT';
  isRecurring: boolean;
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  tags?: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  spent: number;
  isActive: boolean;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isCompleted: boolean;
}

export interface FinancialReport {
  id: string;
  userId: string;
  reportType: 'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'CUSTOM';
  period: string;
  data: any;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Transaction[];
}
