'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Repeat, CheckCircle2, XCircle, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: 'OMR' | 'INR';
  billing_cycle: 'monthly' | 'yearly';
  category: string;
  active: boolean;
  billing_day?: number;
}

interface FinanceSubscriptionsProps {
  subscriptions: Subscription[];
  transactions: any[];
  globalCurrency: 'OMR' | 'INR';
  exchangeRate: number;
  regionTab: 'Global' | 'Oman' | 'India';
}

export default function FinanceSubscriptions({ subscriptions, transactions, globalCurrency, exchangeRate, regionTab }: FinanceSubscriptionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<'OMR' | 'INR'>('OMR');
  const [formBillingCycle, setFormBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [formBillingDay, setFormBillingDay] = useState('1');
  const [formCategory, setFormCategory] = useState('Subscriptions');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (regionTab === 'Oman') {
      setFormCurrency('OMR');
      setFormCategory('Subscription');
    }
    if (regionTab === 'India') {
      setFormCurrency('INR');
      setFormCategory('Education EMI');
    }
  }, [regionTab, isModalOpen]);

  // Sync category when currency changes manually inside modal
  useEffect(() => {
    if (formCurrency === 'INR') {
      setFormCategory('Education EMI');
    } else {
      setFormCategory('Subscription');
    }
  }, [formCurrency]);

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!amountNum || amountNum <= 0) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSub = {
        user_id: user.id,
        name: formName,
        amount: amountNum,
        currency: formCurrency,
        billing_cycle: formBillingCycle,
        billing_day: parseInt(formBillingDay),
        category: formCategory,
        active: true
      };

      let query;
      if (editingSubId) {
        query = supabase.from('finance_subscriptions').update(newSub).eq('id', editingSubId);
      } else {
        query = supabase.from('finance_subscriptions').insert(newSub);
      }

      const { error } = await query;

      if (!error) {
        setIsModalOpen(false);
        setFormName('');
        setFormAmount('');
        setEditingSubId(null);
        router.refresh(); // Force server refetch immediately
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const convert = (amount: number, fromCurrency: string) => {
    if (fromCurrency === globalCurrency) return amount;
    if (globalCurrency === 'INR' && fromCurrency === 'OMR') return amount * exchangeRate;
    if (globalCurrency === 'OMR' && fromCurrency === 'INR') return amount / exchangeRate;
    return amount;
  };

  const handleDeleteSubscription = (id: string) => {
    setDeleteSubId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSubId) return;
    try {
      await supabase.from('finance_subscriptions').delete().eq('id', deleteSubId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteSubId(null);
    }
  };

  const handleEditClick = (sub: Subscription) => {
    setEditingSubId(sub.id);
    setFormName(sub.name);
    setFormAmount(sub.amount.toString());
    setFormCurrency(sub.currency);
    setFormBillingCycle(sub.billing_cycle);
    setFormBillingDay(sub.billing_day ? sub.billing_day.toString() : '1');
    setFormCategory(sub.category);
    setIsModalOpen(true);
  };

  const handleMarkAsPaid = async (sub: Subscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from('finance_transactions').insert({
        user_id: user.id,
        amount: sub.amount,
        currency: sub.currency,
        category: sub.category,
        type: 'expense',
        date: new Date().toISOString(),
        note: `Paid ${sub.name}`,
        subscription_id: sub.id
      });
      
      if (!error) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatMoney = (amount: number, currency: string) => {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${currency}`;
  };

  const activeSubs = subscriptions.filter(s => s.active);
  
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();

  // Check which active subs are already paid this month
  const paidSubscriptionIds = new Set(
    (transactions || [])
      .filter(t => t.subscription_id && t.date.startsWith(currentMonthStr))
      .map(t => t.subscription_id)
  );

  const dueSoonSubs = activeSubs.filter(s => {
    if (paidSubscriptionIds.has(s.id)) return false;
    if (!s.billing_day) return false;
    const diff = s.billing_day - currentDay;
    return diff <= 3; // Due within 3 days or overdue
  });

  const otherSubs = subscriptions.filter(s => !dueSoonSubs.includes(s));

  const monthlyTotal = activeSubs.reduce((acc, sub) => {
    let amount = convert(sub.amount, sub.currency);
    if (sub.billing_cycle === 'yearly') amount = amount / 12;
    return acc + amount;
  }, 0);

  return (
    <div className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col select-none max-w-sm w-full mt-6">
      
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl">
            <Repeat className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">Recurring Bills</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{formatMoney(monthlyTotal, globalCurrency)} / month</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingSubId(null);
            setFormName('');
            setFormAmount('');
            setIsModalOpen(true);
          }}
          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        
        {/* Due Soon Section */}
        {dueSoonSubs.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3">Due Soon / Overdue</h4>
            <div className="space-y-3">
              {dueSoonSubs.map(sub => (
                <div key={sub.id} className="flex flex-col p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
                        <CreditCard className="h-4 w-4 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{sub.name}</h4>
                        <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mt-0.5">
                          {(() => {
                            if (!sub.billing_day) return 'Due Now';
                            const diff = sub.billing_day - currentDay;
                            if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`;
                            if (diff === 0) return 'Due Today';
                            return `Due in ${diff} day${diff > 1 ? 's' : ''}`;
                          })()}
                        </p>
                      </div>
                    </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                          {formatMoney(sub.amount, sub.currency)}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <button onClick={() => handleEditClick(sub)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteSubscription(sub.id)} className="p-1 text-rose-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  <button 
                    onClick={() => handleMarkAsPaid(sub)}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Mark as Paid
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherSubs.length > 0 || dueSoonSubs.length > 0 ? otherSubs.map(sub => {
          const isPaidThisMonth = paidSubscriptionIds.has(sub.id);
          return (
            <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-[#0d0d0d]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
                  <CreditCard className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    {sub.name}
                    {isPaidThisMonth && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold">PAID</span>
                    )}
                    {!isPaidThisMonth && !sub.active && (
                      <XCircle className="h-3 w-3 text-zinc-500" />
                    )}
                  </h4>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                    {sub.billing_cycle} {sub.billing_day ? `• ${sub.billing_day}${['st','nd','rd'][((sub.billing_day%10)-1)]||'th'}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-xs font-black ${sub.active ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 line-through'}`}>
                  {formatMoney(sub.amount, sub.currency)}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={() => handleEditClick(sub)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDeleteSubscription(sub.id)} className="p-1 text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-4 text-center text-zinc-500 text-xs font-bold">No recurring subscriptions.</div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-[#fafafa]/80 dark:bg-zinc-950/20">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{editingSubId ? 'Edit Recurring Bill' : 'Add Recurring Bill'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1c1c1c] cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Bill Name</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Education EMI" className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-500/50" />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Amount</label>
                  <input type="number" step="0.01" required value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-500/50" placeholder="0.00" />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Currency</label>
                  <select 
                    value={formCurrency} 
                    onChange={e => setFormCurrency(e.target.value as any)} 
                    disabled={regionTab !== 'Global'}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-3 px-3 text-sm font-bold outline-none focus:border-indigo-500/50 disabled:opacity-50"
                  >
                    <option value="OMR">OMR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Cycle</label>
                  <select value={formBillingCycle} onChange={e => setFormBillingCycle(e.target.value as any)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-indigo-500/50">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Deduction Day</label>
                  <input type="number" min="1" max="31" required value={formBillingDay} onChange={e => setFormBillingDay(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-indigo-500/50" placeholder="e.g. 5" />
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Category</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-purple-500/50">
                    {formCurrency === 'INR' ? (
                      <>
                        <option value="Education EMI">Education EMI</option>
                        <option value="SIP">SIP</option>
                        <option value="Gold invest">Gold invest</option>
                        <option value="Kuri(Chit Fund)">Kuri (Chit Fund)</option>
                        <option value="Credit card">Credit card</option>
                        <option value="Send To Home">Send To Home</option>
                        <option value="Recharge(mobile)">Recharge (Mobile)</option>
                        <option value="Remittance">Remittance</option>
                        <option value="Self spend">Self spend</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Cash gift(Remitance in Kind)">Cash gift (Remittance in Kind)</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="MESS food">MESS food</option>
                        <option value="Wifi recharge">Wifi recharge</option>
                        <option value="Turf">Turf</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Invest(save money)">Invest (Save money)</option>
                        <option value="Fooding">Fooding</option>
                        <option value="Outing">Outing</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

              <button type="submit" disabled={isSubmitting || !formName || !formAmount} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm cursor-pointer">
                {isSubmitting ? 'Saving...' : 'Add Bill'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteSubId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-scale-up p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">Delete Bill?</h3>
            <p className="text-sm text-zinc-500 mb-6">Are you sure you want to permanently stop and delete this recurring bill?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSubId(null)} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
