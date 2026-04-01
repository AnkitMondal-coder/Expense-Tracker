import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Category, Wallet, Transaction, Budget, RecurringExpense, Goal } from '../lib/types';
import { useAuth } from './AuthContext';

interface DataContextType {
  categories: Category[];
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  goals: Goal[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id' | 'is_default'>) => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateRecurringExpense: (id: string, expense: Partial<RecurringExpense>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user) {
      setCategories([]);
      setWallets([]);
      setTransactions([]);
      setBudgets([]);
      setRecurringExpenses([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [categoriesRes, walletsRes, transactionsRes, budgetsRes, recurringRes, goalsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('wallets').select('*').order('created_at'),
        supabase.from('transactions').select('*, categories(*), wallets(*)').order('date', { ascending: false }),
        supabase.from('budgets').select('*, categories(*)').order('created_at'),
        supabase.from('recurring_expenses').select('*, categories(*), wallets(*)').order('created_at'),
        supabase.from('goals').select('*').order('created_at'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (walletsRes.data) setWallets(walletsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (budgetsRes.data) setBudgets(budgetsRes.data);
      if (recurringRes.data) setRecurringExpenses(recurringRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('transactions').insert([{ ...transaction, user_id: user.id }]).select();
    if (!error && data) {
      await refreshData();
      const wallet = wallets.find((w) => w.id === transaction.wallet_id);
      if (wallet) {
        const newBalance = transaction.type === 'income'
          ? wallet.balance + transaction.amount
          : wallet.balance - transaction.amount;
        await updateWallet(wallet.id, { balance: newBalance });
      }
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const oldTransaction = transactions.find((t) => t.id === id);
    if (!oldTransaction) return;

    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (!error) {
      if (updates.amount !== undefined || updates.type !== undefined || updates.wallet_id !== undefined) {
        const oldWallet = wallets.find((w) => w.id === oldTransaction.wallet_id);
        if (oldWallet) {
          const revertBalance = oldTransaction.type === 'income'
            ? oldWallet.balance - oldTransaction.amount
            : oldWallet.balance + oldTransaction.amount;
          await updateWallet(oldWallet.id, { balance: revertBalance });
        }

        const newWalletId = updates.wallet_id || oldTransaction.wallet_id;
        const newType = updates.type || oldTransaction.type;
        const newAmount = updates.amount || oldTransaction.amount;
        const newWallet = wallets.find((w) => w.id === newWalletId);
        if (newWallet) {
          const newBalance = newType === 'income'
            ? newWallet.balance + newAmount
            : newWallet.balance - newAmount;
          await updateWallet(newWallet.id, { balance: newBalance });
        }
      }
      await refreshData();
    }
  };

  const deleteTransaction = async (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      const wallet = wallets.find((w) => w.id === transaction.wallet_id);
      if (wallet) {
        const newBalance = transaction.type === 'income'
          ? wallet.balance - transaction.amount
          : wallet.balance + transaction.amount;
        await updateWallet(wallet.id, { balance: newBalance });
      }
      await refreshData();
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'created_at' | 'user_id' | 'is_default'>) => {
    if (!user) return;
    const { error } = await supabase.from('categories').insert([{ ...category, user_id: user.id, is_default: false }]);
    if (!error) await refreshData();
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('wallets').insert([{ ...wallet, user_id: user.id }]);
    if (!error) await refreshData();
  };

  const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
    const { error } = await supabase.from('wallets').update(wallet).eq('id', id);
    if (!error) await refreshData();
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('budgets').insert([{ ...budget, user_id: user.id }]);
    if (!error) await refreshData();
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    const { error } = await supabase.from('budgets').update(budget).eq('id', id);
    if (!error) await refreshData();
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) await refreshData();
  };

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('recurring_expenses').insert([{ ...expense, user_id: user.id }]);
    if (!error) await refreshData();
  };

  const updateRecurringExpense = async (id: string, expense: Partial<RecurringExpense>) => {
    const { error } = await supabase.from('recurring_expenses').update(expense).eq('id', id);
    if (!error) await refreshData();
  };

  const deleteRecurringExpense = async (id: string) => {
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (!error) await refreshData();
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('goals').insert([{ ...goal, user_id: user.id }]);
    if (!error) await refreshData();
  };

  const updateGoal = async (id: string, goal: Partial<Goal>) => {
    const { error } = await supabase.from('goals').update(goal).eq('id', id);
    if (!error) await refreshData();
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) await refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        wallets,
        transactions,
        budgets,
        recurringExpenses,
        goals,
        loading,
        refreshData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        addWallet,
        updateWallet,
        addBudget,
        updateBudget,
        deleteBudget,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        addGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
