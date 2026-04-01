/*
  # Expense Tracker Database Schema

  ## Overview
  Complete database schema for an advanced expense tracker with multi-wallet support,
  budgets, recurring expenses, and savings goals.

  ## Tables Created

  ### 1. categories
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `type` (text) - 'expense' or 'income'
  - `icon` (text) - Icon identifier
  - `color` (text) - Color code for UI
  - `is_default` (boolean) - System vs user-created
  - `user_id` (uuid) - Owner (null for default categories)
  - `created_at` (timestamptz)

  ### 2. wallets
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `name` (text) - Wallet name
  - `type` (text) - 'cash', 'bank', 'upi', 'card'
  - `balance` (decimal) - Current balance
  - `created_at` (timestamptz)

  ### 3. transactions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `type` (text) - 'expense' or 'income'
  - `amount` (decimal) - Transaction amount
  - `category_id` (uuid) - FK to categories
  - `wallet_id` (uuid) - FK to wallets
  - `date` (date) - Transaction date
  - `notes` (text) - Optional notes
  - `created_at` (timestamptz)

  ### 4. budgets
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `category_id` (uuid) - FK to categories
  - `amount` (decimal) - Budget limit
  - `period` (text) - 'monthly', 'weekly', 'yearly'
  - `created_at` (timestamptz)

  ### 5. recurring_expenses
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `category_id` (uuid) - FK to categories
  - `wallet_id` (uuid) - FK to wallets
  - `amount` (decimal) - Recurring amount
  - `frequency` (text) - 'daily', 'weekly', 'monthly', 'yearly'
  - `next_date` (date) - Next occurrence
  - `description` (text) - Description
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz)

  ### 6. goals
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `name` (text) - Goal name
  - `target_amount` (decimal) - Target amount
  - `current_amount` (decimal) - Current savings
  - `deadline` (date) - Target date
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users
  - Users can only see their own data
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  icon text NOT NULL DEFAULT 'circle',
  color text NOT NULL DEFAULT '#6B7280',
  is_default boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'upi', 'card')),
  balance decimal(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  amount decimal(12, 2) NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount decimal(12, 2) NOT NULL,
  period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, period)
);

-- Create recurring_expenses table
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  amount decimal(12, 2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date date NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount decimal(12, 2) NOT NULL,
  current_amount decimal(12, 2) DEFAULT 0,
  deadline date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view default categories and own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_default = true OR user_id = auth.uid());

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_default = false);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = false)
  WITH CHECK (user_id = auth.uid() AND is_default = false);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = false);

-- Wallets policies
CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own wallets"
  ON wallets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Budgets policies
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Recurring expenses policies
CREATE POLICY "Users can view own recurring expenses"
  ON recurring_expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own recurring expenses"
  ON recurring_expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recurring expenses"
  ON recurring_expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own recurring expenses"
  ON recurring_expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default categories
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  ('Food & Dining', 'expense', 'utensils', '#EF4444', true),
  ('Shopping', 'expense', 'shopping-bag', '#F59E0B', true),
  ('Travel', 'expense', 'plane', '#3B82F6', true),
  ('Entertainment', 'expense', 'film', '#8B5CF6', true),
  ('Bills & Utilities', 'expense', 'receipt', '#10B981', true),
  ('Healthcare', 'expense', 'heart-pulse', '#EC4899', true),
  ('Education', 'expense', 'graduation-cap', '#6366F1', true),
  ('Personal Care', 'expense', 'user', '#14B8A6', true),
  ('Rent', 'expense', 'home', '#F97316', true),
  ('Transportation', 'expense', 'car', '#84CC16', true),
  ('Salary', 'income', 'briefcase', '#10B981', true),
  ('Freelance', 'income', 'laptop', '#3B82F6', true),
  ('Investment', 'income', 'trending-up', '#8B5CF6', true),
  ('Other Income', 'income', 'plus-circle', '#6B7280', true),
  ('Other Expense', 'expense', 'minus-circle', '#6B7280', true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON recurring_expenses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);