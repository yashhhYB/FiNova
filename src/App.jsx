import React, { useState, useEffect } from 'react';
import { useFinance } from './data';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import {
  Moon, Sun, ShieldCheck, Eye, ChevronDown,
  LayoutDashboard, List, Menu, X,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', Icon: List },
];

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const { role, setRole, theme, toggleTheme } = useFinance();
  const [roleOpen, setRoleOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`h-14 bg-surface/90 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">F</span>
          </div>
          <span className="font-bold text-ink text-[17px] tracking-tight">
            Fin<span className="text-gradient">ova.</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-dim hover:text-ink hover:bg-border/50 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Role switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleOpen(v => !v)}
              className={`flex items-center gap-2 h-9 px-3 rounded-xl border text-sm font-semibold transition-colors ${role === 'admin'
                  ? 'border-brand/40 bg-brand/10 text-brand'
                  : 'border-border text-ink hover:bg-border/40'
                }`}
            >
              {role === 'admin' ? <ShieldCheck size={14} /> : <Eye size={14} className="text-dim" />}
              <span className="hidden sm:block">{role === 'admin' ? 'Admin' : 'Viewer'}</span>
              <ChevronDown size={12} className={`text-dim transition-transform duration-200 ${roleOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setRoleOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-2xl shadow-pop z-40 py-2 overflow-hidden">
                  {[
                    { id: 'viewer', label: 'Viewer', desc: 'Read-only access', Icon: Eye },
                    { id: 'admin', label: 'Admin', desc: 'Full access', Icon: ShieldCheck },
                  ].map(({ id, label, desc, Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setRole(id); setRoleOpen(false); }}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-sm hover:bg-border/40 transition-colors ${role === id ? 'text-brand font-semibold' : 'text-ink'}`}
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

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { transactions } = useFinance();

  // Close mobile nav on page change
  const navigate = (id) => {
    setCurrentPage(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      {/* Page Header */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-6">
        <div className="px-6 py-5 border border-border/60 bg-surface rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink tracking-tight leading-tight">
              Finance <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-dim mt-1.5 font-medium">
              Track your income, spending, and financial health
            </p>
          </div>

          {/* Mobile nav toggle */}
          <button
            onClick={() => setMobileNavOpen(v => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-bg border border-border text-ink hover:bg-border/40 transition-colors ml-3 shrink-0"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="md:hidden mt-2 bg-surface border border-border rounded-2xl shadow-sm overflow-hidden fade-up">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = currentPage === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold border-b border-border/40 last:border-0 transition-colors ${isActive ? 'text-brand bg-brand/5' : 'text-ink hover:bg-border/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-brand' : 'text-dim'} />
                    <span>{label}</span>
                  </div>
                  {id === 'transactions' && transactions.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-brand/15 text-brand' : 'bg-border/60 text-dim'}`}>
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
          <p className="text-[11px] font-bold text-dim uppercase tracking-wider mb-3 px-1">
            Navigation
          </p>
          <div className="flex flex-col gap-1">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = currentPage === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className={`relative flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group overflow-hidden ${isActive
                      ? 'text-brand bg-surface shadow-sm border border-border'
                      : 'text-dim hover:text-ink hover:bg-border/40 border border-transparent'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-brand rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon size={15} className={isActive ? 'text-brand' : 'text-dim group-hover:text-ink transition-colors'} />
                    <span>{label}</span>
                  </div>
                  {id === 'transactions' && transactions.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-brand/15 text-brand' : 'bg-border/60 text-dim'}`}>
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
          {currentPage === 'dashboard' ? <Dashboard /> : <Transactions />}
        </div>
      </main>
    </div>
  );
}
