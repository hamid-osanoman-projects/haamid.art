import React from 'react';
import { createClient } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';
const FinanceClientWrapper = dynamic(() => import('./FinanceClientWrapper'), { ssr: false });

// --- MOCK FALLBACK DATA ---
const MOCK_TRANSACTIONS = [
  { id: '1', amount: 15.5, currency: 'OMR', category: 'Food', type: 'expense', date: new Date().toISOString(), note: 'Shawarma and Coffee' },
  { id: '2', amount: 1500, currency: 'INR', category: 'Shopping', type: 'expense', date: new Date(Date.now() - 86400000).toISOString(), note: 'Amazon purchase' },
  { id: '3', amount: 50, currency: 'OMR', category: 'Transport', type: 'expense', date: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Fuel' },
  { id: '4', amount: 850, currency: 'OMR', category: 'Salary', type: 'income', date: new Date(Date.now() - 86400000 * 5).toISOString(), note: 'Monthly Salary' },
  { id: '5', amount: 12000, currency: 'INR', category: 'Freelance', type: 'income', date: new Date(Date.now() - 86400000 * 10).toISOString(), note: 'Logo Design Project' },
];

const MOCK_SUBSCRIPTIONS = [
  { id: 's1', name: 'Netflix Premium', amount: 999, currency: 'INR', billing_cycle: 'monthly', category: 'Entertainment', active: true },
  { id: 's2', name: 'Vercel Pro', amount: 8, currency: 'OMR', billing_cycle: 'monthly', category: 'Subscriptions', active: true },
  { id: 's3', name: 'Gym Membership', amount: 20, currency: 'OMR', billing_cycle: 'monthly', category: 'Other', active: true },
];

const MOCK_BUDGETS = [
  { currency: 'OMR', limit_amount: 400 },
  { currency: 'INR', limit_amount: 50000 }
];
export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let transactions = MOCK_TRANSACTIONS;
  let subscriptions = MOCK_SUBSCRIPTIONS;
  let currentBudgets = MOCK_BUDGETS;

  if (user) {
    try {
      const [txRes, subRes, budRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('finance_subscriptions').select('*').eq('user_id', user.id),
        supabase.from('finance_budgets').select('*').eq('user_id', user.id).eq('month_year', new Date().toISOString().slice(0, 7))
      ]);

      if (txRes.data && txRes.data.length > 0) {
        transactions = txRes.data as any;
      }
      if (subRes.data && subRes.data.length > 0) {
        subscriptions = subRes.data as any;
      }
      if (budRes.data && budRes.data.length > 0) {
        currentBudgets = budRes.data as any;
      }
    } catch (err) {
      console.error('Failed to load finance data, using mocks.', err);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 p-6 xl:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Client Wrapper handles the Global Currency State */}
        <FinanceClientWrapper 
          initialTransactions={transactions}
          initialSubscriptions={subscriptions}
          budgets={currentBudgets}
        />

      </div>
    </div>
  );
}
