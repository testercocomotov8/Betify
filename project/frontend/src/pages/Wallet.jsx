import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useUserStore from '../store/userStore';

export default function Wallet() {
  const { balance, exposure, available } = useUserStore();
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/account/statement');
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 100) {
      setMessage({ type: 'error', text: 'Minimum deposit is ₹100' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/account/statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Deposited ₹${amount} successfully!` });
        setAmount('');
        fetchTransactions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Deposit failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Deposit failed. Try again.' });
    }
    setLoading(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 100) {
      setMessage({ type: 'error', text: 'Minimum withdrawal is ₹100' });
      return;
    }
    if (parseFloat(amount) > available) {
      setMessage({ type: 'error', text: 'Insufficient available balance' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/account/statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdraw', amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Withdrawal of ₹${amount} initiated!` });
        setAmount('');
        fetchTransactions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Withdrawal failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Withdrawal failed. Try again.' });
    }
    setLoading(false);
  };

  const getTypeColor = (type) => {
    const colors = {
      deposit: 'text-green-600',
      withdraw: 'text-red-600',
      bet_win: 'text-green-600',
      bet_loss: 'text-red-600',
      bet_place: 'text-orange-600',
      bet_void: 'text-gray-600',
      cashout: 'text-blue-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const getTypeIcon = (type) => {
    const icons = {
      deposit: '+',
      withdraw: '-',
      bet_win: '✓',
      bet_loss: '✗',
      bet_place: '•',
      bet_void: '○',
      cashout: '⇄',
    };
    return icons[type] || '•';
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-600 to-teal-700 text-white p-6 m-4 rounded-2xl shadow-lg"
      >
        <p className="text-teal-100 text-sm mb-1">Available Balance</p>
        <p className="text-4xl font-bold mb-4">₹{available.toFixed(2)}</p>
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-teal-200">Total Balance</p>
            <p className="font-semibold">₹{balance.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-teal-200">In Exposure</p>
            <p className="font-semibold">₹{exposure.toFixed(2)}</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mx-4 mb-4">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'deposit'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-white text-gray-700'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'withdraw'
              ? 'bg-red-500 text-white shadow-lg'
              : 'bg-white text-gray-700'
          }`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-teal-500 text-white shadow-lg'
              : 'bg-white text-gray-700'
          }`}
        >
          History
        </button>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-4 mb-4 p-3 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Deposit Form */}
      {activeTab === 'deposit' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white mx-4 p-6 rounded-2xl shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Add Funds</h3>
          <form onSubmit={handleDeposit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  ₹{val}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Deposit Now'}
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Min deposit: ₹100 • Instant processing
            </p>
          </form>
        </motion.div>
      )}

      {/* Withdraw Form */}
      {activeTab === 'withdraw' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white mx-4 p-6 rounded-2xl shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-amber-800">
              Available for withdrawal: <span className="font-bold">₹{available.toFixed(2)}</span>
            </p>
          </div>
          <form onSubmit={handleWithdraw}>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
                max={available}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(Math.min(val, available)))}
                  className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  ₹{Math.min(val, available)}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || available <= 0}
              className="w-full py-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Withdraw Now'}
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Min withdrawal: ₹100 • Processed within 24 hours
            </p>
          </form>
        </motion.div>
      )}

      {/* Transaction History */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden"
        >
          <h3 className="text-lg font-semibold p-4 border-b">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No transactions yet</p>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <span className={getTypeColor(tx.type)}>{getTypeIcon(tx.type)}</span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{tx.note || new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}