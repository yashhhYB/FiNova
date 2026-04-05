import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../data';
import { formatCurrency } from '../utils';
import { Search, LayoutDashboard, List, X, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export function CommandPalette({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const { transactions } = useFinance();
  const inputRef = useRef(null);

  // Ctrl+K to open/close
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => { if (!v) setQuery(''); return !v; });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return transactions
      .filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, transactions]);

  const commands = [
    {
      label: 'Overview Dashboard', desc: 'Financial summary & charts',
      Icon: LayoutDashboard, kbd: 'D',
      action: () => { onNavigate('dashboard'); setOpen(false); },
    },
    {
      label: 'Transactions', desc: 'View & manage transactions',
      Icon: List, kbd: 'T',
      action: () => { onNavigate('transactions'); setOpen(false); },
    },
  ];

  const allItems = query.trim() ? results : commands;
  const isCommands = !query.trim();

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && isCommands && commands[activeIdx]) {
        commands[activeIdx].action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allItems, activeIdx, isCommands]);

  useEffect(() => setActiveIdx(0), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[16vh] bg-ink/60 backdrop-blur-md modal-backdrop"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden modal-content"
        style={{ boxShadow: '0 48px 120px -16px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Glass surface */}
        <div className="bg-surface/95 backdrop-blur-2xl border border-border/50">

          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
            <Search size={15} className="text-brand shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search transactions or navigate…"
              className="flex-1 bg-transparent text-sm font-medium text-ink placeholder-dim/50 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-dim hover:text-ink hover:rotate-90 transition-all duration-200"
              >
                <X size={13} />
              </button>
            )}
            <kbd className="text-[10px] px-1.5 py-0.5 border border-border rounded bg-bg font-mono text-dim">ESC</kbd>
          </div>

          {/* Results area */}
          <div className="overflow-y-auto max-h-[400px]">

            {/* No query → show navigation commands */}
            {!query.trim() && (
              <div className="p-2">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest px-3 py-2">Quick Navigate</p>
                {commands.map(({ label, desc, Icon, kbd, action }, i) => (
                  <button
                    key={label}
                    onClick={action}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                      activeIdx === i ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-border/40 hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        activeIdx === i ? 'bg-brand/20 text-brand' : 'bg-border/40 text-dim group-hover:bg-border/70'
                      }`}>
                        <Icon size={15} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold leading-none">{label}</p>
                        <p className="text-[11px] text-dim mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="text-[10px] px-1.5 py-0.5 border border-border/70 rounded bg-bg/60 font-mono text-dim">{kbd}</kbd>
                      <ArrowRight size={12} className={`text-brand transition-all duration-200 ${activeIdx === i ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Query → show matching transactions */}
            {query.trim() && results.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest px-3 py-2">
                  Transactions ({results.length})
                </p>
                {results.map((t, i) => (
                  <div
                    key={t.id}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-default transition-all duration-150 group ${
                      activeIdx === i ? 'bg-border/50' : 'hover:bg-border/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      t.type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.description.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{t.description}</p>
                      <p className="text-[11px] text-dim mt-0.5">
                        {t.category} · {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-extrabold tabular-nums flex items-center gap-0.5 ${
                        t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {t.type === 'income' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {query.trim() && results.length === 0 && (
              <div className="py-14 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm font-semibold text-ink">No results</p>
                <p className="text-xs text-dim mt-1">Try searching for a description or category</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/30 bg-bg/30">
            <span className="text-[10px] text-dim flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border/60 rounded bg-bg/80 text-[9px] font-mono">↑↓</kbd> Navigate
            </span>
            <span className="text-[10px] text-dim flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border/60 rounded bg-bg/80 text-[9px] font-mono">↵</kbd> Select
            </span>
            <span className="text-[10px] text-dim flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border/60 rounded bg-bg/80 text-[9px] font-mono">ESC</kbd> Close
            </span>
            <span className="ml-auto text-[10px] text-dim">
              <kbd className="px-1.5 py-0.5 border border-border/60 rounded bg-bg/80 text-[9px] font-mono">⌘K</kbd> anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
