'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FinanceOverview from '@/components/dashboard/FinanceOverview';
import FinanceTransactions from '@/components/dashboard/FinanceTransactions';
import FinanceSubscriptions from '@/components/dashboard/FinanceSubscriptions';

interface FinanceClientWrapperProps {
  initialTransactions: any[];
  initialSubscriptions: any[];
  budgets: any[];
}

export default function FinanceClientWrapper({ initialTransactions, initialSubscriptions, budgets }: FinanceClientWrapperProps) {
  const [globalCurrency, setGlobalCurrency] = useState<'OMR' | 'INR'>('OMR');
  const [regionTab, setRegionTab] = useState<'Global' | 'Oman' | 'India'>('Global');
  const router = useRouter();

  // Establish real-time connection to Supabase tables
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('finance_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_subscriptions' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_budgets' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
  
  // Fixed exchange rate for now, or fetch from API later
  // 1 OMR = 217 INR
  const exchangeRate = 217;

  // Filter based on Region Tab
  const filteredTransactions = initialTransactions.filter(tx => {
    if (regionTab === 'Oman') return tx.currency === 'OMR';
    if (regionTab === 'India') return tx.currency === 'INR';
    return true; // Global
  });

  const filteredSubscriptions = initialSubscriptions.filter(sub => {
    if (regionTab === 'Oman') return sub.currency === 'OMR';
    if (regionTab === 'India') return sub.currency === 'INR';
    return true;
  });

  // Determine active budget limit based on region
  let activeBudgetLimit = 0;
  if (regionTab === 'Oman') {
    const b = budgets.find(b => b.currency === 'OMR');
    activeBudgetLimit = b ? b.limit_amount : 0;
  } else if (regionTab === 'India') {
    const b = budgets.find(b => b.currency === 'INR');
    activeBudgetLimit = b ? b.limit_amount : 0;
  } else {
    // Global: Combine budgets in globalCurrency
    let total = 0;
    budgets.forEach(b => {
      if (b.currency === globalCurrency) total += b.limit_amount;
      else if (b.currency === 'OMR' && globalCurrency === 'INR') total += b.limit_amount * exchangeRate;
      else if (b.currency === 'INR' && globalCurrency === 'OMR') total += b.limit_amount / exchangeRate;
    });
    activeBudgetLimit = total;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 select-none">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
            Finance Tracker
          </h1>
          <p className="text-sm font-semibold text-zinc-500 mt-1">
            Monitor expenses, budgets, and subscriptions across Oman and India.
          </p>
        </div>

        {/* Global Currency Toggle */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">View In:</span>
          <div className="flex gap-1 bg-zinc-100 dark:bg-[#0d0d0d] p-1 rounded-xl">
            <button
              onClick={() => setGlobalCurrency('OMR')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                globalCurrency === 'OMR' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              OMR
            </button>
            <button
              onClick={() => setGlobalCurrency('INR')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                globalCurrency === 'INR' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              INR
            </button>
          </div>
        </div>
      </div>

      {/* Region Tabs */}
      <div className="flex bg-zinc-100 dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-sm mb-6 max-w-md w-full mx-auto md:mx-0">
        {(['Global', 'Oman', 'India'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setRegionTab(tab);
              // Auto-switch view currency based on region for convenience
              if (tab === 'Oman') setGlobalCurrency('OMR');
              if (tab === 'India') setGlobalCurrency('INR');
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              regionTab === tab
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <FinanceOverview 
        transactions={filteredTransactions}
        budgetLimit={activeBudgetLimit}
        regionTab={regionTab}
        globalCurrency={globalCurrency}
        exchangeRate={exchangeRate}
      />

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1">
          <FinanceTransactions 
            initialTransactions={filteredTransactions}
            globalCurrency={globalCurrency}
            exchangeRate={exchangeRate}
            onTransactionAdded={() => {}} // Not needed anymore due to real-time
            regionTab={regionTab}
          />
        </div>
        <div className="xl:w-80 shrink-0">
          <FinanceSubscriptions 
            subscriptions={filteredSubscriptions}
            transactions={filteredTransactions}
            globalCurrency={globalCurrency}
            exchangeRate={exchangeRate}
            regionTab={regionTab}
          />
        </div>
      </div>
    </>
  );
}
