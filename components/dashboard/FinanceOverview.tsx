'use client';

import React, { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, RefreshCcw, 
  AlertTriangle, CheckCircle2, DollarSign, PiggyBank,
  PieChart as PieChartIcon, Edit2, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface FinanceOverviewProps {
  transactions: any[];
  budgetLimit: number;
  regionTab: 'Global' | 'Oman' | 'India';
  globalCurrency: 'OMR' | 'INR';
  exchangeRate: number; // 1 OMR = X INR
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981', // emerald
  Transport: '#3b82f6', // blue
  Utilities: '#f59e0b', // amber
  Shopping: '#8b5cf6', // violet
  Entertainment: '#ec4899', // pink
  Subscriptions: '#6366f1', // indigo
  Other: '#9ca3af', // gray
};

export default function FinanceOverview({ transactions, budgetLimit, regionTab, globalCurrency, exchangeRate }: FinanceOverviewProps) {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<'OMR' | 'INR'>('OMR');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  
  // Helper to convert to global currency
  const convert = (amount: number, fromCurrency: string) => {
    if (fromCurrency === globalCurrency) return amount;
    if (globalCurrency === 'INR' && fromCurrency === 'OMR') return amount * exchangeRate;
    if (globalCurrency === 'OMR' && fromCurrency === 'INR') return amount / exchangeRate;
    return amount;
  };

  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${globalCurrency}`;
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const currentMonthExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
  }, [transactions, globalCurrency, exchangeRate]);

  const currentMonthIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + convert(t.amount, t.currency), 0);
  }, [transactions, globalCurrency, exchangeRate]);

  // The raw budgetLimit passed as a prop might be in OMR (if Oman tab) or INR (if India tab).
  // We must convert it to the globalCurrency for accurate progress bars and remaining budget math.
  // If the regionTab is 'Global', the wrapper has already converted it to the globalCurrency.
  const displayBudgetLimit = useMemo(() => {
    if (regionTab === 'Global') return budgetLimit;
    if (regionTab === 'Oman') return convert(budgetLimit, 'OMR');
    if (regionTab === 'India') return convert(budgetLimit, 'INR');
    return budgetLimit;
  }, [budgetLimit, regionTab, globalCurrency, exchangeRate]);

  const budgetPercentage = displayBudgetLimit > 0 ? (currentMonthExpenses / displayBudgetLimit) * 100 : 0;
  
  let budgetColor = 'bg-emerald-500';
  let budgetTextColor = 'text-emerald-500';
  if (budgetPercentage > 70) { budgetColor = 'bg-amber-500'; budgetTextColor = 'text-amber-500'; }
  if (budgetPercentage > 90) { budgetColor = 'bg-rose-500'; budgetTextColor = 'text-rose-500'; }

  // Pie Chart Data
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr)).forEach(t => {
      map[t.category] = (map[t.category] || 0) + convert(t.amount, t.currency);
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] })).sort((a,b) => b.value - a.value);
  }, [transactions, globalCurrency, exchangeRate]);

  // Line Chart Data (Daily Spend)
  const dailySpendData = useMemo(() => {
    const map: Record<string, number> = {};
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    // initialize empty days
    for(let i=1; i<=daysInMonth; i++) {
      const dayStr = `${currentMonthStr}-${i.toString().padStart(2, '0')}`;
      map[dayStr] = 0;
    }

    transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr)).forEach(t => {
      map[t.date] += convert(t.amount, t.currency);
    });

    return Object.keys(map).map(date => ({
      date: date.slice(-2), // just day number
      amount: map[date]
    })).sort((a,b) => a.date.localeCompare(b.date));
  }, [transactions, globalCurrency, exchangeRate]);

  const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Alert Banner if over budget */}
      {budgetPercentage > 95 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <div>
              <h4 className="text-sm font-bold text-rose-500">Budget Warning!</h4>
              <p className="text-xs text-rose-400/80">You have used {budgetPercentage.toFixed(0)}% of your monthly budget. Slow down!</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Spent */}
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <TrendingDown className="h-6 w-6 text-rose-500" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Spent This Month</h3>
            <span className="text-3xl font-black text-zinc-800 dark:text-zinc-100">{formatMoney(currentMonthExpenses)}</span>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50`}>
              <Wallet className={`h-6 w-6 ${budgetTextColor}`} />
            </div>
            {budgetLimit > 0 && (
              <span className={`text-sm font-bold ${budgetTextColor}`}>{budgetPercentage.toFixed(0)}% used</span>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Remaining Budget</h3>
              {regionTab !== 'Global' && (
                <button 
                  onClick={() => {
                    setBudgetCurrency(regionTab === 'Oman' ? 'OMR' : 'INR');
                    setBudgetInput(budgetLimit ? budgetLimit.toString() : '');
                    setIsBudgetModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-md transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  {budgetLimit > 0 ? 'Edit' : 'Set Budget'}
                </button>
              )}
            </div>
            {budgetLimit > 0 ? (
              <>
                <span className={`text-3xl font-black ${budgetTextColor}`}>{formatMoney(Math.max(0, displayBudgetLimit - currentMonthExpenses))}</span>
                <div className="mt-4 h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${budgetColor} transition-all duration-500`} style={{ width: `${Math.min(100, budgetPercentage)}%` }} />
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-zinc-500 font-semibold flex flex-col gap-2">
                <span>No budget limit set for {regionTab}.</span>
                {regionTab === 'Global' && <span className="text-xs">Set budgets in the Oman and India tabs.</span>}
              </div>
            )}
          </div>
        </div>

        {/* Savings / Income */}
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <PiggyBank className="h-6 w-6 text-emerald-500" />
            </div>
            {savingsRate > 0 && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                {savingsRate.toFixed(1)}% Saved
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Income</h3>
            <span className="text-3xl font-black text-zinc-800 dark:text-zinc-100">{formatMoney(currentMonthIncome)}</span>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Donut Chart */}
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-purple-500" /> Spend by Category
          </h3>
          {expensesByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Other']} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatMoney(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {expensesByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS['Other'] }} />
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-zinc-500 text-xs font-bold">No expenses this month.</div>
          )}
        </div>

        {/* Daily Trend Line Chart */}
        <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" /> Daily Spend Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySpendData}>
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => formatMoney(value)}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#fff' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#18181b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-[#fafafa]/80 dark:bg-zinc-950/20">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Set Monthly Budget</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1c1c1c] cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingBudget(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // Convert back to OMR as base currency for storage if needed, or store native
                // For simplicity, we just store it in the chosen currency and use conversion when reading
                const { error } = await supabase.from('finance_budgets').upsert({
                  user_id: user.id,
                  month_year: currentMonthStr,
                  limit_amount: parseFloat(budgetInput),
                  currency: budgetCurrency
                }, { onConflict: 'user_id,month_year,currency' });

                if (!error) {
                  setIsBudgetModalOpen(false);
                  router.refresh();
                }
              } catch (err) {
                console.error(err);
              } finally {
                setIsSavingBudget(false);
              }
            }} className="p-5 space-y-4">
              
              <p className="text-xs text-zinc-500 font-semibold mb-2">
                Set a limit to track your spending and get warnings if you go over budget.
              </p>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Amount</label>
                  <input type="number" step="1" required value={budgetInput} onChange={e => setBudgetInput(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-purple-500/50" placeholder="0" />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Currency</label>
                  <select value={budgetCurrency} onChange={e => setBudgetCurrency(e.target.value as any)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-3 text-sm font-bold outline-none focus:border-purple-500/50">
                    <option value="OMR">OMR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isSavingBudget || !budgetInput} className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm cursor-pointer">
                {isSavingBudget ? 'Saving...' : 'Save Budget'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
