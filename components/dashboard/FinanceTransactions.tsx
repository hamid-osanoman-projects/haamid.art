'use client';

import React, { useState } from 'react';
import { 
  Plus, Search, ArrowUpRight, ArrowDownRight, MoreVertical, X, Calendar, MapPin, LayoutList
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  amount: number;
  currency: 'OMR' | 'INR';
  category: string;
  type: 'expense' | 'income';
  date: string;
  note: string;
}

interface FinanceTransactionsProps {
  initialTransactions: Transaction[];
  globalCurrency: 'OMR' | 'INR';
  exchangeRate: number;
  onTransactionAdded: () => void;
  regionTab: 'Global' | 'Oman' | 'India';
}

export default function FinanceTransactions({ initialTransactions, globalCurrency, exchangeRate, onTransactionAdded, regionTab }: FinanceTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Sync state with server updates for real-time
  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);
  
  // Form state
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<'OMR' | 'INR'>('OMR');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNote, setFormNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-set currency when opening modal in a specific region
  React.useEffect(() => {
    if (regionTab === 'Oman') setFormCurrency('OMR');
    if (regionTab === 'India') setFormCurrency('INR');
  }, [regionTab, isModalOpen]);

  const supabase = createClient();
  const router = useRouter();

  const convert = (amount: number, fromCurrency: string) => {
    if (fromCurrency === globalCurrency) return amount;
    if (globalCurrency === 'INR' && fromCurrency === 'OMR') return amount * exchangeRate;
    if (globalCurrency === 'OMR' && fromCurrency === 'INR') return amount / exchangeRate;
    return amount;
  };

  const formatMoney = (amount: number, currency: string) => {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${currency}`;
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!amountNum || amountNum <= 0) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newTx = {
        user_id: user?.id,
        amount: amountNum,
        currency: formCurrency,
        category: formCategory,
        type: formType,
        date: formDate,
        note: formNote
      };

      const { data, error } = await supabase
        .from('finance_transactions')
        .insert(newTx)
        .select()
        .single();

      if (!error && data) {
        setTransactions(prev => [data, ...prev]);
        setIsModalOpen(false);
        setFormAmount('');
        setFormNote('');
        onTransactionAdded(); // Trigger parent refresh if needed
        router.refresh(); // Force server refetch immediately
      } else {
        // Fallback for mock environment
        const mockTx = { id: Math.random().toString(), ...newTx };
        setTransactions(prev => [mockTx as any, ...prev]);
        setIsModalOpen(false);
        setFormAmount('');
        setFormNote('');
        onTransactionAdded(); // Trigger parent refresh if needed
        router.refresh(); // Force server refetch immediately
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = transactions.filter(t => 
    t.note?.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  // Calendar Logic
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getDayTransactions = (day: number | null) => {
    if (!day) return { income: 0, expense: 0, count: 0 };
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTxs = filtered.filter(t => t.date.startsWith(dateStr));
    const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
    const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
    return { income, expense, count: dayTxs.length };
  };

  return (
    <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col mt-6 select-none max-w-6xl w-full min-w-0">
      
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-zinc-800 dark:text-zinc-100">Recent Transactions</h3>
          <p className="text-xs text-zinc-500 font-semibold mt-1">All your logged expenses and income.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[150px] sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-purple-500/50 text-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-hidden">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0d0d0d] border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Note</th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filtered.length > 0 ? filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{tx.note || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black flex items-center gap-1 ${tx.type === 'income' ? 'text-emerald-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
                      </span>
                      {tx.currency !== globalCurrency && (
                        <span className="text-[9px] font-bold text-zinc-400">
                          ≈ {formatMoney(convert(tx.amount, tx.currency), globalCurrency)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs font-bold">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/80 border-t border-zinc-100 dark:border-zinc-800/80">
            {filtered.length > 0 ? filtered.map(tx => (
              <div key={tx.id} className="p-4 flex justify-between items-start hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {tx.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{tx.note || '-'}</span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-sm font-black flex items-center gap-1 ${tx.type === 'income' ? 'text-emerald-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
                  </span>
                  {tx.currency !== globalCurrency && (
                    <span className="text-[9px] font-bold text-zinc-400 mt-0.5">
                      ≈ {formatMoney(convert(tx.amount, tx.currency), globalCurrency)}
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-zinc-500 text-xs font-bold">No transactions found.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 sm:p-6">
          <div className="w-full">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[8px] sm:text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day, i) => {
                const { income, expense, count } = getDayTransactions(day);
                const isToday = day === today.getDate();
                
                return (
                  <div 
                    key={i} 
                    className={`min-h-[50px] sm:min-h-[80px] p-1 sm:p-2 rounded-lg sm:rounded-xl border ${day ? 'bg-zinc-50 dark:bg-[#121212] border-zinc-200 dark:border-zinc-800' : 'bg-transparent border-transparent'} ${isToday ? 'ring-2 ring-indigo-500/50' : ''}`}
                  >
                    {day && (
                      <div className="flex flex-col h-full">
                        <span className={`text-[10px] sm:text-xs font-bold ${isToday ? 'text-indigo-500' : 'text-zinc-500'}`}>{day}</span>
                        <div className="mt-auto space-y-0.5 sm:space-y-1 pt-1 sm:pt-2">
                          {income > 0 && (
                            <div className="text-[7px] sm:text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-0.5 sm:px-1 py-[1px] sm:py-0.5 rounded truncate">
                              +{formatMoney(income, globalCurrency)}
                            </div>
                          )}
                          {expense > 0 && (
                            <div className="text-[7px] sm:text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 px-0.5 sm:px-1 py-[1px] sm:py-0.5 rounded truncate">
                              -{formatMoney(expense, globalCurrency)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-[#fafafa]/80 dark:bg-zinc-950/20">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Log Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1c1c1c] cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              
              {/* Type Toggle */}
              <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl">
                <button type="button" onClick={() => setFormType('expense')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formType === 'expense' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setFormType('income')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formType === 'income' ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  Income
                </button>
              </div>

              {/* Amount & Currency */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Amount</label>
                  <input type="number" step="0.01" required value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-purple-500/50" placeholder="0.00" />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Currency</label>
                  <select 
                    value={formCurrency} 
                    onChange={e => setFormCurrency(e.target.value as any)} 
                    disabled={regionTab !== 'Global'}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-3 text-sm font-bold outline-none focus:border-purple-500/50 disabled:opacity-50"
                  >
                    <option value="OMR">OMR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              {/* Category & Date */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Category</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-purple-500/50">
                    {formType === 'expense' ? (
                      <>
                        <option value="Food">Food & Dining</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Subscriptions">Subscriptions</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Salary">Salary</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Investment">Investment</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Date</label>
                  <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-purple-500/50" />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Note (Optional)</label>
                <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="What was this for?" className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-xs outline-none focus:border-purple-500/50" />
              </div>

              <button type="submit" disabled={isSubmitting || !formAmount} className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm cursor-pointer">
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
