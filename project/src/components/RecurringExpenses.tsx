import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, X, Trash2, RefreshCw, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';

export const RecurringExpenses = () => {
  const { recurringExpenses, categories, wallets, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = useData();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDate, setNextDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRecurringExpense({
      description,
      amount: parseFloat(amount),
      category_id: categoryId,
      wallet_id: walletId,
      frequency,
      next_date: nextDate,
      is_active: true,
    });
    setShowForm(false);
    setDescription('');
    setAmount('');
    setNextDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateRecurringExpense(id, { is_active: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring expense?')) {
      await deleteRecurringExpense(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recurring Expenses</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Recurring
        </button>
      </div>

      <div className="space-y-2">
        {recurringExpenses.map((expense) => {
          const category = categories.find((c) => c.id === expense.category_id);
          const wallet = wallets.find((w) => w.id === expense.wallet_id);

          return (
            <div
              key={expense.id}
              className={`bg-white rounded-xl shadow-sm p-4 border transition-all ${
                expense.is_active
                  ? 'border-gray-100 hover:border-emerald-200'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <RefreshCw className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{expense.description}</span>
                      {!expense.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Paused</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{category?.name}</span>
                      <span>•</span>
                      <span>{wallet?.name}</span>
                      <span>•</span>
                      <span className="capitalize">{expense.frequency}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Next: {format(new Date(expense.next_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{Number(expense.amount).toFixed(2)}
                  </span>

                  <button
                    onClick={() => toggleActive(expense.id, expense.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      expense.is_active
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={expense.is_active ? 'Pause' : 'Resume'}
                  >
                    {expense.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {recurringExpenses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500">No recurring expenses set yet. Click the button above to add one!</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Recurring Expense</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Netflix Subscription"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a wallet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors capitalize ${
                        frequency === freq
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Occurrence</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add Recurring Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
