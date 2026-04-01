import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, X, Trash2, Target, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const Goals = () => {
  const { goals, updateGoal, addGoal, deleteGoal, transactions } = useData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const goalsWithProgress = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const availableSavings = totalIncome - totalExpenses;

    return goals.map((goal) => {
      const percentage = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
      const remaining = Number(goal.target_amount) - Number(goal.current_amount);
      const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;

      let recommendation = '';
      if (daysLeft && daysLeft > 0 && remaining > 0) {
        const dailySavings = remaining / daysLeft;
        const monthlySavings = dailySavings * 30;
        recommendation = `Save ₹${dailySavings.toFixed(2)}/day or ₹${monthlySavings.toFixed(2)}/month`;
      }

      return {
        ...goal,
        percentage,
        remaining,
        daysLeft,
        recommendation,
        availableSavings,
      };
    });
  }, [goals, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGoal({
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: 0,
      deadline: deadline || null,
    });
    setShowForm(false);
    setName('');
    setTargetAmount('');
    setDeadline('');
  };

  const handleContribution = async (goalId: string) => {
    if (!contributionAmount) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    await updateGoal(goalId, {
      current_amount: Number(goal.current_amount) + parseFloat(contributionAmount),
    });
    setSelectedGoal(null);
    setContributionAmount('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Savings Goals</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalsWithProgress.map((goal) => {
          const isCompleted = goal.percentage >= 100;

          return (
            <div
              key={goal.id}
              className={`bg-white rounded-xl shadow-sm p-6 border ${
                isCompleted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-600' : 'bg-blue-100'}`}>
                    <Target className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    {goal.deadline && (
                      <p className="text-sm text-gray-600">
                        {goal.daysLeft && goal.daysLeft > 0
                          ? `${goal.daysLeft} days left`
                          : goal.daysLeft === 0
                          ? 'Due today'
                          : 'Overdue'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">
                    ₹{Number(goal.current_amount).toFixed(2)} / ₹{Number(goal.target_amount).toFixed(2)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      isCompleted ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{goal.percentage.toFixed(1)}% complete</span>
                  {!isCompleted && (
                    <span className="text-gray-600">₹{goal.remaining.toFixed(2)} remaining</span>
                  )}
                </div>

                {goal.recommendation && !isCompleted && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-900">Smart Recommendation</p>
                      <p className="text-sm text-blue-700">{goal.recommendation}</p>
                    </div>
                  </div>
                )}

                {!isCompleted && (
                  <div className="pt-2">
                    {selectedGoal === goal.id ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Amount to add"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleContribution(goal.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGoal(null);
                              setContributionAmount('');
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedGoal(goal.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        Add Contribution
                      </button>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-3 text-center">
                    <p className="text-emerald-800 font-semibold">Goal Achieved!</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {goalsWithProgress.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500">No goals set yet. Click the button above to create one!</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Savings Goal</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., New Laptop"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
