import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from './data';
import { getTotals, getSavingsRate, getTopCategory, formatCurrency } from './utils';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { ToastProvider } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import {
  Moon, Sun, ShieldCheck, Eye, ChevronDown,
  LayoutDashboard, List, Menu, X, TrendingUp, TrendingDown, Keyboard,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard',    label: 'Overview',      Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions',  Icon: List },
];

// ── Aurora animated background ───────────────────────────────────────────────
function Aurora() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="aurora-blob aurora-4" />
    </div>
  );
}

// ── Live clock hook ───────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Stats ticker ─────────────────────────────────────────────────────────────
function StatsTicker() {
  const { transactions } = useFinance();
  if (!transactions.length) return null;

  const { income, expenses, balance } = getTotals(transactions);
  const savings = getSavingsRate(income, expenses).toFixed(0);
  const top = getTopCategory(transactions);
  const isPositive = balance >= 0;

  const items = [
    { label: 'Net Balance',    value: formatCurrency(balance),      positive: isPositive },
    { label: 'Total Income',   value: formatCurrency(income),       positive: true },
    { label: 'Expenses',       value: formatCurrency(expenses),     positive: false },
    { label: 'Savings Rate',   value: `${savings}%`,               positive: parseFloat(savings) > 20 },
    { label: 'Transactions',   value: `${transactions.length} txns`, positive: null },
    ...(top ? [{ label: 'Top Spend', value: top.name, positive: null }] : []),
    { label: '●',              value: '',                           positive: null, isDot: true },
  ];

  // Triple to ensure seamless loop
  const all = [...items, ...items, ...items];

  return (
    <div className="border-b border-border/30 bg-surface/40 backdrop-blur-md overflow-hidden h-8 flex items-center select-none">
      <div className="ticker-track">
        {all.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-4">
            {item.isDot ? (
              <span className="text-border text-xs">◆</span>
            ) : (
              <>
                <span className="text-[10px] font-semibold text-dim uppercase tracking-widest">{item.label}</span>
                <span className={`text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${
                  item.positive === true  ? 'text-emerald-500 dark:text-emerald-400' :
                  item.positive === false ? 'text-rose-500 dark:text-rose-400' : 'text-ink'
                }`}>
                  {item.positive === true  && <TrendingUp size={9} />}
                  {item.positive === false && <TrendingDown size={9} />}
                  {item.value}
                </span>
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { role, setRole, theme, toggleTheme } = useFinance();
  const [roleOpen, setRoleOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [themeKey, setThemeKey] = useState(0);
  const now = useClock();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleToggleTheme = () => { toggleTheme(); setThemeKey(k => k + 1); };

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <nav className={`h-14 bg-surface/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/8' : ''}`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center shadow-sm logo-animated transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <span className="text-white text-xs font-black">F</span>
          </div>
          <span className="font-bold text-ink text-[17px] tracking-tight">Fin<span className="text-gradient">ova.</span></span>
        </div>

        {/* Live clock — hidden on small screens */}
        <div className="hidden lg:flex flex-col items-center leading-none">
          <span className="text-xs font-bold text-ink tabular-nums">{timeStr}</span>
          <span className="text-[10px] text-dim mt-0.5">{dateStr}</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            title="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-dim hover:text-ink hover:bg-border/50 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <span key={themeKey} className="theme-icon-enter inline-flex">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setRoleOpen(v => !v)}
              className={`flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                role === 'admin'
                  ? 'border-brand/40 bg-brand/10 text-brand shadow-sm'
                  : 'border-border text-ink hover:bg-border/40'
              }`}
            >
              {role === 'admin' ? <ShieldCheck size={14} /> : <Eye size={14} className="text-dim" />}
              <span className="hidden sm:block">{role === 'admin' ? 'Admin' : 'Viewer'}</span>
              <ChevronDown size={12} className={`text-dim transition-transform duration-300 ${roleOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setRoleOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-pop z-40 py-2 overflow-hidden dropdown-appear">
                  {[
                    { id: 'viewer', label: 'Viewer', desc: 'Read-only access', Icon: Eye },
                    { id: 'admin',  label: 'Admin',  desc: 'Full access',      Icon: ShieldCheck },
                  ].map(({ id, label, desc, Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setRole(id); setRoleOpen(false); }}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-sm transition-all duration-150 hover:translate-x-1 ${
                        role === id ? 'text-brand font-semibold bg-brand/5' : 'text-ink hover:bg-border/40'
                      }`}
                    >
                      <Icon size={15} className="mt-0.5 shrink-0" />
                      <div className="text-left">
                        <p className="leading-none">{label}</p>
                        <p className="text-[11px] text-dim mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Keyboard shortcuts hint ───────────────────────────────────────────────────
function ShortcutsHint() {
  const [show, setShow] = useState(false);
  return (
    <div className="fixed bottom-6 left-6 z-50">
      {show && (
        <div className="mb-2 bg-surface/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-pop p-4 w-56 slide-down">
          <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-3">Keyboard Shortcuts</p>
          {[
            { key: '⌘K', label: 'Command palette' },
            { key: 'D',  label: 'Dashboard' },
            { key: 'T',  label: 'Transactions' },
            { key: '?',  label: 'Toggle this hint' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <span className="text-xs text-dim">{label}</span>
              <kbd className="text-[10px] px-1.5 py-0.5 border border-border rounded bg-bg font-mono text-ink">{key}</kbd>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => setShow(v => !v)}
        title="Keyboard shortcuts (?)"
        className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm font-bold shadow-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          show
            ? 'bg-brand text-brand-fg border-brand/40 rotate-12'
            : 'bg-surface/90 backdrop-blur-xl border-border/60 text-dim hover:text-ink hover:border-border'
        }`}
      >
        ?
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [prevPage, setPrevPage] = useState(null);
  const [pageKey, setPageKey] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { transactions } = useFinance();

  const navigate = (id) => {
    if (id === currentPage) return;
    setPrevPage(currentPage);
    setCurrentPage(id);
    setPageKey(k => k + 1);
    setMobileNavOpen(false);
  };

  // Global keyboard shortcuts (D / T / ?)
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'd') navigate('dashboard');
      if (e.key === 't') navigate('transactions');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage]);

  const tabIds = TABS.map(t => t.id);
  const goingRight = prevPage && tabIds.indexOf(currentPage) > tabIds.indexOf(prevPage);

  return (
    <ToastProvider>
      {/* Aurora background layer */}
      <Aurora />

      {/* Command Palette — available everywhere */}
      <CommandPalette onNavigate={navigate} />

      {/* Keyboard shortcuts hint */}
      <ShortcutsHint />

      <div className="relative min-h-screen bg-bg/90 z-10">
        <Navbar />
        <StatsTicker />

        {/* Page Header */}
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-6 fade-up">
          <div className="px-6 py-5 border border-border/50 bg-surface/70 backdrop-blur-sm rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink tracking-tight leading-tight">
                Finance <span className="text-gradient">Dashboard</span>
              </h1>
              <p className="text-sm text-dim mt-1.5 font-medium">Track your income, spending, and financial health</p>
            </div>

            {/* Mobile nav toggle */}
            <button
              onClick={() => setMobileNavOpen(v => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-bg border border-border text-ink hover:bg-border/40 transition-all duration-200 hover:scale-110 active:scale-95 ml-3 shrink-0"
              aria-label="Toggle navigation"
            >
              <span className={`transition-all duration-300 inline-flex ${mobileNavOpen ? 'rotate-90' : ''}`}>
                {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
              </span>
            </button>
          </div>

          {mobileNavOpen && (
            <div className="md:hidden mt-2 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl shadow-sm overflow-hidden mobile-nav-drawer">
              {TABS.map(({ id, label, Icon }) => {
                const isActive = currentPage === id;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold border-b border-border/40 last:border-0 transition-all duration-200 ${
                      isActive ? 'text-brand bg-brand/5' : 'text-ink hover:bg-border/30 hover:translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-brand' : 'text-dim'} />
                      <span>{label}</span>
                    </div>
                    {id === 'transactions' && transactions.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold badge-pulse ${isActive ? 'bg-brand/15 text-brand' : 'bg-border/60 text-dim'}`}>
                        {transactions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main layout */}
        <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6 items-start">

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-52 shrink-0 lg:w-48 sticky top-20 fade-up">
            <p className="text-[11px] font-bold text-dim uppercase tracking-wider mb-3 px-1">Navigation</p>
            <div className="flex flex-col gap-1">
              {TABS.map(({ id, label, Icon }) => {
                const isActive = currentPage === id;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className={`relative flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-250 group overflow-hidden ${
                      isActive
                        ? 'text-brand bg-surface/80 shadow-sm border border-border/70 scale-[1.02]'
                        : 'text-dim hover:text-ink hover:bg-border/40 border border-transparent hover:scale-[1.01]'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-brand rounded-r-full" />}
                    <div className="flex items-center gap-3">
                      <Icon size={15} className={`transition-all duration-200 ${isActive ? 'text-brand scale-110' : 'text-dim group-hover:text-ink group-hover:scale-105'}`} />
                      <span>{label}</span>
                    </div>
                    {id === 'transactions' && transactions.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${isActive ? 'bg-brand/15 text-brand' : 'bg-border/60 text-dim'}`}>
                        {transactions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div key={pageKey} className={pageKey > 0 ? (goingRight ? 'slide-from-right' : 'slide-from-left') : 'page-enter'}>
              {currentPage === 'dashboard' ? <Dashboard /> : <Transactions />}
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
