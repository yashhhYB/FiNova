import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../data';
import { formatCurrency, formatDate } from '../utils';
import { EmptyState } from './Dashboard';
import {
  Plus, Search, ArrowUpDown, Receipt, X,
  SlidersHorizontal, UploadCloud, Pencil, Trash2, ChevronDown,
  TrendingUp, TrendingDown,
} from 'lucide-react';

const CATEGORIES = [
  'Housing', 'Groceries', 'Utilities', 'Transport', 'Entertainment',
  'Health', 'Dining', 'Travel', 'Salary', 'Freelance', 'Other',
];

// Deterministic status based on amount
const getStatus = (amount) => {
  if (amount > 500) return 'Pending';
  if (amount < 100) return 'Failed';
  return 'Success';
};

const STATUS_STYLES = {
  Success: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  Failed: 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
};

// ── Transaction Modal ─────────────────────────────────────────────────────────
function TransactionModal({ open, onClose, editing }) {
  const { addTransaction, updateTransaction, role } = useFinance();
  const firstRef = useRef(null);
  const blank = {
    description: '', amount: '', category: 'Groceries',
    type: 'expense', date: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editing
      ? { ...editing, amount: String(editing.amount), date: new Date(editing.date).toISOString().slice(0, 10) }
      : blank
    );
  }, [editing, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => firstRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || role !== 'admin') return null;

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      const payload = { ...form, amount, date: new Date(form.date).toISOString() };
      if (editing) await updateTransaction({ ...editing, ...payload });
      else await addTransaction(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/50 backdrop-blur-sm modal-backdrop">
      <div className="bg-surface border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md modal-content">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <div>
            <h2 className="text-base font-extrabold text-ink">
              {editing ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p className="text-xs text-dim mt-0.5">
              {editing ? 'Update the transaction details' : 'Record a new income or expense'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg text-dim hover:text-ink hover:bg-border/60 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="p-1 bg-bg border border-border rounded-xl flex relative">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-surface shadow-sm transition-all duration-300 ${form.type === 'expense' ? 'left-1' : 'left-[calc(50%+3px)]'}`} />
            {['expense', 'income'].map(t => (
              <button
                key={t} type="button"
                onClick={() => set('type', t)}
                className={`relative flex-1 py-2 rounded-lg text-xs font-bold capitalize z-10 transition-colors ${form.type === t
                    ? t === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    : 'text-dim hover:text-ink'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">Description</label>
            <input
              ref={firstRef} required value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Monthly Salary, Grocery run…"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-bg focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all font-medium text-ink placeholder-dim/50"
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim font-semibold text-sm">$</span>
                <input
                  required type="number" min="0.01" step="0.01"
                  value={form.amount} onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm bg-bg focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all font-semibold text-ink tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">Date</label>
              <input
                required type="date" value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-bg focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all font-medium text-ink"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-dim uppercase tracking-wider mb-1.5">Category</label>
            <div className="relative">
              <select
                value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-bg focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all font-medium text-ink appearance-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={saving}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 ${form.type === 'expense'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-brand hover:opacity-90 text-brand-fg'
              }`}
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : `Add ${form.type.charAt(0).toUpperCase() + form.type.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Transactions Page ─────────────────────────────────────────────────────────
export function Transactions() {
  const { transactions, role, deleteTransaction, loading } = useFinance();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');   // all | income | expense
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const exportCSV = () => {
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(), t.amount,
      `"${t.category}"`, t.type, `"${t.description}"`,
    ]);
    const csv = [['Date', 'Amount', 'Category', 'Type', 'Description'], ...rows]
      .map(r => r.join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'finova-transactions.csv' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const list = useMemo(() => {
    let items = filter === 'all' ? [...transactions] : transactions.filter(t => t.type === filter);

    if (query) {
      const q = query.toLowerCase();
      items = items.filter(t =>
        t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => {
      const diff = sortKey === 'date'
        ? new Date(a.date) - new Date(b.date)
        : a.amount - b.amount;
      return sortDir === 'asc' ? diff : -diff;
    });
    return items;
  }, [transactions, query, filter, sortKey, sortDir]);

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const openEdit = (t) => { setEditing(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter label helper
  const filterLabel = filter === 'all' ? 'All Types' : filter.charAt(0).toUpperCase() + filter.slice(1);

  return (
    <div className="bg-surface border border-border/80 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 min-h-[70vh] fade-up">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-border/40">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search transactions…"
            className="w-full border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm bg-bg focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all font-medium placeholder-dim/60 text-ink"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-ink">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold transition-colors ${filter !== 'all' ? 'border-brand text-brand bg-brand/5' : 'border-border text-ink hover:bg-border/30'
                }`}
            >
              <SlidersHorizontal size={13} />
              {filterLabel}
              <ChevronDown size={11} className={`text-dim transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-surface border border-border rounded-xl shadow-pop z-20 py-1.5 overflow-hidden">
                  {[
                    { id: 'all', label: 'All Types' },
                    { id: 'income', label: 'Income' },
                    { id: 'expense', label: 'Expense' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => { setFilter(id); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${filter === id ? 'text-brand bg-brand/5' : 'text-ink hover:bg-border/40'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-ink hover:bg-border/30 transition-colors"
          >
            <UploadCloud size={13} />
            Export
          </button>

          {role === 'admin' && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink text-surface rounded-xl text-xs font-bold hover:bg-ink/80 transition-colors shadow-sm"
            >
              <Plus size={13} />
              Add New
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Pills (mobile) ── */}
      <div className="flex gap-3 mb-5 sm:hidden">
        <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Income</p>
          <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
        <div className="flex-1 bg-rose-50 dark:bg-rose-500/10 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-0.5">Expenses</p>
          <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
            {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
        <div className="flex-1 bg-bg border border-border rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-dim uppercase tracking-wide mb-0.5">Count</p>
          <p className="text-sm font-extrabold text-ink">{list.length}</p>
        </div>
      </div>

      {/* ── Empty State ── */}
      {list.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description={query ? 'Try adjusting your search term.' : 'Add your first transaction to get started.'}
          icon={<Receipt size={22} className="text-dim" />}
        />
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    { label: 'Name / Business', key: 'description' },
                    { label: 'Date', key: 'date' },
                    { label: 'Invoice ID', key: null },
                    { label: 'Amount', key: 'amount' },
                    { label: 'Status', key: null },
                  ].map(({ label, key }) => (
                    <th
                      key={label}
                      onClick={key ? () => toggleSort(key) : undefined}
                      className={`py-3.5 px-3 text-[11px] font-bold text-dim uppercase tracking-wider ${key ? 'cursor-pointer hover:text-ink select-none' : ''}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {label}
                        {key && <ArrowUpDown size={11} className={sortKey === key ? 'text-brand' : ''} />}
                      </span>
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-[11px] font-bold text-dim uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => {
                  const date = new Date(t.date);
                  const invoiceId = 'PMX' + t.id.slice(0, 5).toUpperCase();
                  const status = getStatus(t.amount);
                  return (
                    <tr key={t.id} className="group border-b border-border/30 hover:bg-bg/60 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${t.type === 'income'
                              ? 'bg-brand/10 text-brand dark:bg-brand/20'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                            }`}>
                            {t.description.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink leading-none">{t.description}</p>
                            <p className="text-xs text-dim mt-0.5">{t.category}</p>
                          </div>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="py-4 px-3">
                        <p className="text-sm font-semibold text-ink leading-none">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-dim mt-0.5">
                          {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      {/* Invoice */}
                      <td className="py-4 px-3">
                        <span className="text-xs font-bold text-dim tracking-wide">{invoiceId}</span>
                      </td>
                      {/* Amount */}
                      <td className="py-4 px-3">
                        <span className={`text-sm font-extrabold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${STATUS_STYLES[status]}`}>
                          {status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        {role === 'admin' ? (
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(t)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-dim hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteTransaction(t.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-dim hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <button className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-ink hover:bg-border/40 transition-colors">
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card List ── */}
          <div className="md:hidden space-y-3">
            {list.map((t) => {
              const status = getStatus(t.amount);
              const invoiceId = 'PMX' + t.id.slice(0, 5).toUpperCase();
              return (
                <div key={t.id} className="bg-bg border border-border/60 rounded-2xl p-4 flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${t.type === 'income'
                      ? 'bg-brand/10 text-brand'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                    }`}>
                    {t.description.charAt(0).toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink truncate">{t.description}</p>
                        <p className="text-xs text-dim mt-0.5">{t.category} · {invoiceId}</p>
                      </div>
                      <span className={`text-sm font-extrabold shrink-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${STATUS_STYLES[status]}`}>
                          {status}
                        </span>
                        <span className="text-[10px] text-dim">
                          {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {role === 'admin' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(t)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface border border-border text-dim hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(t.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface border border-border text-dim hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <TransactionModal open={modalOpen} onClose={closeModal} editing={editing} />
    </div>
  );
}
