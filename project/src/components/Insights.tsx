import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { AlertCircle, TrendingUp, TrendingDown, Zap, Target } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';

export const Insights = () => {
  const { transactions, budgets, categories } = useData();

  const insights = useMemo(() => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const lastMonth = subMonths(today, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);

    const currentMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentMonth && transactionDate <= currentMonthEnd;
    });

    const lastMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
    });

    const insights: Array<{
      type: 'warning' | 'success' | 'info' | 'danger';
      icon: React.ReactNode;
      title: string;
      description: string;
    }> = [];

    const expensesCurrentMonth = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expensesLastMonth = lastMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (expensesLastMonth > 0) {
      const percentageChange = ((expensesCurrentMonth - expensesLastMonth) / expensesLastMonth) * 100;

      if (percentageChange > 15) {
        insights.push({
          type: 'danger',
          icon: <AlertCircle className="w-5 h-5" />,
          title: 'Spending Alert',
          description: `Your expenses increased ${percentageChange.toFixed(0)}% compared to last month. Current: ₹${expensesCurrentMonth.toFixed(0)}, Last month: ₹${expensesLastMonth.toFixed(0)}`,
        });
      } else if (percentageChange > 5) {
        insights.push({
          type: 'warning',
          icon: <TrendingUp className="w-5 h-5" />,
          title: 'Spending Trend',
          description: `Your expenses increased ${percentageChange.toFixed(0)}% this month. Keep an eye on spending patterns.`,
        });
      } else if (percentageChange < -10) {
        insights.push({
          type: 'success',
          icon: <TrendingDown className="w-5 h-5" />,
          title: 'Great Savings!',
          description: `You've reduced your spending by ${Math.abs(percentageChange).toFixed(0)}% compared to last month!`,
        });
      }
    }

    budgets.forEach((budget) => {
      const categoryExpense = currentMonthTransactions
        .filter((t) => t.type === 'expense' && t.category_id === budget.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = (categoryExpense / Number(budget.amount)) * 100;
      const category = categories.find((c) => c.id === budget.category_id);

      if (percentage > 100) {
        insights.push({
          type: 'danger',
          icon: <AlertCircle className="w-5 h-5" />,
          title: `Budget Exceeded: ${category?.name}`,
          description: `You've exceeded your ${category?.name} budget by ₹${(categoryExpense - Number(budget.amount)).toFixed(0)}`,
        });
      } else if (percentage > 80) {
        insights.push({
          type: 'warning',
          icon: <Zap className="w-5 h-5" />,
          title: `Budget Warning: ${category?.name}`,
          description: `You're at ${percentage.toFixed(0)}% of your ${category?.name} budget. ₹${(Number(budget.amount) - categoryExpense).toFixed(0)} remaining.`,
        });
      }
    });

    const categorySpending = new Map<string, number>();
    currentMonthTransactions.forEach((t) => {
      if (t.type === 'expense') {
        const current = categorySpending.get(t.category_id) || 0;
        categorySpending.set(t.category_id, current + Number(t.amount));
      }
    });

    const topCategory = Array.from(categorySpending.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      const category = categories.find((c) => c.id === topCategory[0]);
      const lastMonthSpending = lastMonthTransactions
        .filter((t) => t.type === 'expense' && t.category_id === topCategory[0])
        .reduce((sum, t) => sum + Number(t.amount), 0);

      if (lastMonthSpending > 0) {
        const changePercent = ((topCategory[1] - lastMonthSpending) / lastMonthSpending) * 100;
        if (Math.abs(changePercent) > 10) {
          insights.push({
            type: 'info',
            icon: <TrendingUp className="w-5 h-5" />,
            title: `${category?.name} Changed`,
            description: `Your ${category?.name} spending ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(0)}% this month.`,
          });
        }
      }
    }

    const incomeCurrent = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate = incomeCurrent > 0 ? ((incomeCurrent - expensesCurrentMonth) / incomeCurrent) * 100 : 0;

    if (incomeCurrent > 0 && savingsRate < 20) {
      insights.push({
        type: 'warning',
        icon: <Target className="w-5 h-5" />,
        title: 'Low Savings Rate',
        description: `You're saving only ${savingsRate.toFixed(0)}% of your income this month. Try to aim for at least 20%.`,
      });
    } else if (savingsRate >= 30) {
      insights.push({
        type: 'success',
        icon: <Target className="w-5 h-5" />,
        title: 'Excellent Savings',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income! Keep it up!`,
      });
    }

    const daysLeftInMonth = differenceInDays(currentMonthEnd, today);
    const avgDailySpend = expensesCurrentMonth / (30 - daysLeftInMonth);
    const projectedMonthlySpend = avgDailySpend * 30;

    if (daysLeftInMonth > 0 && projectedMonthlySpend > expensesCurrentMonth * 1.2) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Spending Projection',
        description: `At your current rate, you'll spend ₹${projectedMonthlySpend.toFixed(0)} this month. Current: ₹${expensesCurrentMonth.toFixed(0)}`,
      });
    }

    return insights.slice(0, 5);
  }, [transactions, budgets, categories]);

  const typeStyles = {
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Insights</h2>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No insights yet. Keep tracking your expenses!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const styles = typeStyles[insight.type];
            return (
              <div
                key={idx}
                className={`rounded-xl shadow-sm p-4 border ${styles.bg} ${styles.border} transition-all hover:shadow-md`}
              >
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>{insight.icon}</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${styles.text}`}>{insight.title}</h3>
                    <p className={`text-sm mt-1 ${styles.text} opacity-90`}>{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
