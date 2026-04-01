import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Wallet as WalletIcon, CreditCard, Banknote, Smartphone, Plus, X } from 'lucide-react';

const walletIcons = {
  cash: Banknote,
  bank: WalletIcon,
  upi: Smartphone,
  card: CreditCard,
};

export const Wallets = () => {
  const { wallets, addWallet } = useData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'upi' | 'card'>('cash');
  const [balance, setBalance] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addWallet({
      name,
      type,
      balance: parseFloat(balance),
    });
    setShowForm(false);
    setName('');
    setBalance('');
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wallets</h2>
          <p className="text-gray-600">Total Balance: ₹{totalBalance.toFixed(2)}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map((wallet) => {
          const Icon = walletIcons[wallet.type];
          return (
            <div
              key={wallet.id}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-8 h-8" />
                <span className="text-xs uppercase font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
                  {wallet.type}
                </span>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">{wallet.name}</p>
                <p className="text-2xl font-bold">₹{Number(wallet.balance).toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Wallet</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., My Bank Account"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'bank', 'upi', 'card'] as const).map((t) => {
                    const Icon = walletIcons[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          type === t
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto ${type === t ? 'text-emerald-600' : 'text-gray-600'}`} />
                        <span className="text-xs capitalize mt-1 block">{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add Wallet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
