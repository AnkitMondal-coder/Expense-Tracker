import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet as WalletIcon, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, eachMonthOfInterval } from 'date-fns';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];

export const Dashboard = () => {
  const { transactions, budgets, categories } = useData();

  const stats = useMemo(() => {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    const todayTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startToday && transactionDate <= endToday;
    });

    const monthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startMonth && transactionDate <= endMonth;
    });

    const todayExpenses = todayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const todayIncome = todayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      todayExpenses,
      todayIncome,
      monthExpenses,
      monthIncome,
      monthBalance: monthIncome - monthExpenses,
    };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    const monthExpenses = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && transactionDate >= startMonth && transactionDate <= endMonth;
    });

    const categoryMap = new Map<string, { name: string; value: number; color: string }>();

    monthExpenses.forEach((t) => {
      const category = categories.find((c) => c.id === t.category_id);
      if (category) {
        const current = categoryMap.get(category.id) || { name: category.name, value: 0, color: category.color };
        categoryMap.set(category.id, {
          ...current,
          value: current.value + Number(t.amount),
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const trendData = useMemo(() => {
    const today = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(today, 5),
      end: today,
    });

    return months.map((month) => {
      const startMonth = startOfMonth(month);
      const endMonth = endOfMonth(month);

      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startMonth && transactionDate <= endMonth;
      });

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(month, 'MMM'),
        expenses,
        income,
      };
    });
  }, [transactions]);

  const budgetAlerts = useMemo(() => {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    return budgets
      .map((budget) => {
        const spent = transactions
          .filter((t) => {
            const transactionDate = new Date(t.date);
            return (
              t.type === 'expense' &&
              t.category_id === budget.category_id &&
              transactionDate >= startMonth &&
              transactionDate <= endMonth
            );
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percentage = (spent / Number(budget.amount)) * 100;
        const category = categories.find((c) => c.id === budget.category_id);

        return {
          category: category?.name || 'Unknown',
          spent,
          budget: Number(budget.amount),
          percentage,
        };
      })
      .filter((alert) => alert.percentage >= 80);
  }, [budgets, transactions, categories]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today's Expenses</span>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.todayExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today's Income</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.todayIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Month's Expenses</span>
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.monthExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Month's Balance</span>
            <WalletIcon className="w-5 h-5 text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${stats.monthBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{stats.monthBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-900 mb-2">Budget Alerts</h3>
          <div className="space-y-2">
            {budgetAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-red-800">
                  {alert.category}: ₹{alert.spent.toFixed(2)} / ₹{alert.budget.toFixed(2)}
                </span>
                <span className="font-semibold text-red-900">{alert.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No expense data for this month
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trend</h3>
          {trendData.some((d) => d.expenses > 0 || d.income > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No transaction data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
