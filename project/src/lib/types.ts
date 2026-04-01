export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'upi' | 'card';
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'expense' | 'income';
  amount: number;
  category_id: string;
  wallet_id: string;
  date: string;
  notes: string | null;
  created_at: string;
  categories?: Category;
  wallets?: Wallet;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  created_at: string;
  categories?: Category;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id: string;
  wallet_id: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  description: string;
  is_active: boolean;
  created_at: string;
  categories?: Category;
  wallets?: Wallet;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}
