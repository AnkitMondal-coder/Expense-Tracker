import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, X, Trash2, AlertTriangle } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

export const Budgets = () => {
  const { budgets, categories, transactions, addBudget, deleteBudget } = useData();
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const budgetStats = useMemo(() => {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    return budgets.map((budget) => {
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
        ...budget,
        spent,
        percentage,
        category,
        remaining: Number(budget.amount) - spent,
      };
    });
  }, [budgets, transactions, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;

    await addBudget({
      category_id: categoryId,
      amount: parseFloat(amount),
      period,
    });

    setShowForm(false);
    setCategoryId('');
    setAmount('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Set Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetStats.map((budget) => {
          const isWarning = budget.percentage >= 80;
          const isOver = budget.percentage >= 100;

          return (
            <div
              key={budget.id}
              className={`bg-white rounded-xl shadow-sm p-6 border ${
                isOver
                  ? 'border-red-300 bg-red-50'
                  : isWarning
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{budget.category?.name}</h3>
                    {isWarning && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{budget.period}</p>
                </div>
                <button
                  onClick={() => handleDelete(budget.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent</span>
                  <span className="font-semibold">₹{budget.spent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-semibold">₹{Number(budget.amount).toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOver ? 'bg-red-600' : isWarning ? 'bg-orange-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isOver ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {budget.percentage.toFixed(0)}% used
                  </span>
                  <span className={budget.remaining < 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                    ₹{Math.abs(budget.remaining).toFixed(2)} {budget.remaining < 0 ? 'over' : 'left'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {budgetStats.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500">No budgets set yet. Click the button above to add one!</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Set Budget</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors capitalize ${
                        period === p
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Set Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
