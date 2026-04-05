import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useFinance } from "../data";
import {
  getTotals, getSavingsRate, getMonthComparison, getTopCategory,
  getAverageExpense, getBiggestExpense, getMostFrequentCategory,
  getInsightSentence, formatCurrency, formatDate,
} from "../utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Sparkles,
  ShoppingCart, CreditCard, PiggyBank, Zap, Repeat, PieChart as PieIcon,
  Inbox, MoreHorizontal, Award, Target, Activity,
} from "lucide-react";

// ── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ title, description, icon = <Inbox size={28} className="text-dim" /> }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center scale-in">
    <div className="w-14 h-14 rounded-2xl bg-border/30 flex items-center justify-center mb-1 transition-transform duration-300 hover:scale-110">
      {icon}
    </div>
    <p className="font-semibold text-ink text-sm">{title}</p>
    <p className="text-dim text-sm max-w-xs">{description}</p>
  </div>
);

// ── Change badge ─────────────────────────────────────────────────────────────
const ChangeBadge = ({ pct }) => {
  const isPos = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bounce-in ${
      isPos ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40"
             : "text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/40"}`}>
      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPos ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
};

// ── Animated number count-up ──────────────────────────────────────────────────
function AnimatedNumber({ value, formatter = v => v }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = parseFloat(value) || 0;
    const start = Date.now();
    const dur = 950;
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(2, -10 * t);
      setDisplay(target * ease);
      if (t < 1) requestAnimationFrame(tick);
      else setDisplay(target);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{formatter(display)}</span>;
}

// ── Sparkline mini chart ──────────────────────────────────────────────────────
function Sparkline({ data, color, width = 64, height = 24 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * height * 0.85,
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1][0]},${height} L0,${height} Z`;
  const gid = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// Get monthly sparkline data
function getMonthlyData(transactions, type, months = 6) {
  const map = {};
  transactions.filter(t => t.type === type).forEach(t => {
    const d = new Date(t.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    map[k] = (map[k] || 0) + t.amount;
  });
  const sorted = Object.keys(map).sort().slice(-months);
  return sorted.length >= 2 ? sorted.map(k => map[k]) : null;
}

// ── Health Score calculation ─────────────────────────────────────────────────
function calcHealthScore(transactions) {
  if (!transactions.length) return { score: 0, label: 'No Data', color: '#9ca3af', grade: '—' };
  const { income, expenses, balance } = getTotals(transactions);
  const savings = getSavingsRate(income, expenses);
  const comp = getMonthComparison(transactions);

  let score = 0;
  // Savings (0–40 pts)
  score += Math.min(40, savings * 0.8);
  // Positive balance (0–25 pts)
  score += balance > 0 ? Math.min(25, (balance / Math.max(income, 1)) * 50) : 0;
  // Expense trend (0–20 pts)
  if (comp.priorExpenses > 0)
    score += comp.expensePctChange <= 0 ? 20 : Math.max(0, 20 - comp.expensePctChange * 2);
  else score += 10;
  // Category diversity (0–15 pts)
  const cats = new Set(transactions.filter(t => t.type === 'expense').map(t => t.category));
  score += Math.min(15, cats.size * 2.5);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Fair' : 'Needs Work';
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 45 ? 'C' : 'D';
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return { score, label, color, grade };
}

// ── Health Score component ────────────────────────────────────────────────────
function useConfetti() {
  return useCallback(() => {
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { position:'fixed',top:'0',left:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'9999' });
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#f43f5e','#06b6d4','#ec4899','#84cc16'];
    const particles = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width, y: -Math.random() * 200 - 10,
      vx: (Math.random() - 0.5) * 5, vy: 2.5 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 5 + Math.random() * 9, h: 3 + Math.random() * 5,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 10, opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }));
    let start = Date.now(), raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - start; let alive = false;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.rot += p.rotV; p.vx *= 0.995;
        if (elapsed > 2200) p.opacity = Math.max(0, p.opacity - 0.013);
        if (p.opacity > 0) alive = true;
        ctx.save(); ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180); ctx.fillStyle = p.color;
        if (p.shape === 'rect') ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        else { ctx.beginPath(); ctx.arc(0,0,p.w/2,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      });
      if (alive) raf = requestAnimationFrame(draw); else canvas.remove();
    };
    raf = requestAnimationFrame(draw);
  }, []);
}

function HealthScore({ transactions }) {
  const [animated, setAnimated] = useState(false);
  const hasFiredConfetti = useRef(false);
  const fireConfetti = useConfetti();
  const { score, label, color, grade } = useMemo(() => calcHealthScore(transactions), [transactions]);
  const { income, expenses } = getTotals(transactions);
  const savings = getSavingsRate(income, expenses);
  const comp = getMonthComparison(transactions);

  // SVG arc gauge (semicircle)
  const r = 52, cx = 72, cy = 72;
  const arc = Math.PI * r; // semicircle circumference
  const offset = arc - (score / 100) * arc;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Fire confetti when score is excellent — only once per session
  useEffect(() => {
    if (score >= 80 && !hasFiredConfetti.current && animated) {
      hasFiredConfetti.current = true;
      setTimeout(() => fireConfetti(), 1200);
    }
  }, [score, animated]);

  const metrics = [
    {
      label: 'Savings Rate', value: `${savings.toFixed(0)}%`,
      good: savings > 20, Icon: PiggyBank,
    },
    {
      label: 'Monthly Trend', value: comp.priorExpenses > 0 ? `${comp.expensePctChange > 0 ? '+' : ''}${comp.expensePctChange.toFixed(0)}%` : 'N/A',
      good: comp.expensePctChange <= 0, Icon: comp.expensePctChange <= 0 ? TrendingDown : TrendingUp,
    },
    {
      label: 'Balance', value: formatCurrency(income - expenses),
      good: income > expenses, Icon: Activity,
    },
    {
      label: 'Grade', value: grade,
      good: grade === 'A' || grade === 'B', Icon: Award,
    },
  ];

  return (
    <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-sm card-hover shine-hover fade-up">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Gauge */}
        <div className="relative flex-shrink-0">
          <svg width={144} height={80} viewBox="0 0 144 80">
            {/* Track */}
            <path
              d={`M 10,72 A ${r},${r} 0 0 1 134,72`}
              fill="none" stroke="hsl(var(--border))" strokeWidth="9" strokeLinecap="round"
            />
            {/* Fill */}
            <path
              d={`M 10,72 A ${r},${r} 0 0 1 134,72`}
              fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={arc}
              strokeDashoffset={animated ? offset : arc}
              className="gauge-fill"
              style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-3xl font-extrabold text-ink leading-none gauge-number" style={{ color }}>
              <AnimatedNumber value={score} formatter={v => Math.round(v)} />
            </span>
            <span className="text-[10px] font-semibold text-dim mt-0.5 uppercase tracking-widest">/100</span>
          </div>
        </div>

        {/* Label + description */}
        <div className="flex flex-col items-center sm:items-start gap-1 min-w-[100px]">
          <div className="flex items-center gap-2">
            <Target size={14} style={{ color }} />
            <span className="text-xs font-bold text-dim uppercase tracking-widest">Health Score</span>
          </div>
          <p className="text-2xl font-extrabold text-ink" style={{ color }}>{label}</p>
          <p className="text-xs text-dim max-w-[160px] text-center sm:text-left leading-relaxed">
            {score >= 75 ? "You're crushing your financial goals!" :
             score >= 50 ? "Good progress — a few tweaks will help." :
                           "Focus on savings to improve your score."}
          </p>
        </div>

        {/* Metric pills */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {metrics.map(({ label, value, good, Icon }) => (
            <div key={label} className={`rounded-xl p-3 text-center border transition-all duration-200 hover:scale-105 cursor-default ${
              good
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/30'
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/30'
            }`}>
              <Icon size={13} className={`mx-auto mb-1 ${good ? 'text-emerald-500' : 'text-rose-500'}`} />
              <p className="text-[10px] font-semibold text-dim uppercase tracking-wider mb-0.5">{label}</p>
              <p className={`text-sm font-extrabold tabular-nums ${good ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Typing animation for AI insight ─────────────────────────────────────────
function TypedInsight({ text }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const delay = setTimeout(() => {
      const iv = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
        else { clearInterval(iv); setDone(true); }
      }, 18);
      return () => clearInterval(iv);
    }, 400);
    return () => clearTimeout(delay);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="typing-cursor" />}
    </span>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ transactions }) {
  const { income, expenses, balance } = useMemo(() => getTotals(transactions), [transactions]);
  const comparison = useMemo(() => getMonthComparison(transactions), [transactions]);
  const incSpark = useMemo(() => getMonthlyData(transactions, 'income'), [transactions]);
  const expSpark = useMemo(() => getMonthlyData(transactions, 'expense'), [transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Balance */}
      <div className="summary-card gradient-brand rounded-2xl p-6 text-white relative overflow-hidden shadow-pop card-hover shine-hover">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" style={{ animation: 'aurora-drift-1 6s ease-in-out infinite' }} />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/8" style={{ animation: 'aurora-drift-2 8s ease-in-out infinite' }} />
        <p className="text-sm font-medium text-white/70 relative z-10">Net Balance</p>
        <p className="text-4xl font-extrabold mt-2 relative z-10 tracking-tight neon-glow">
          <AnimatedNumber value={balance} formatter={v => formatCurrency(v)} />
        </p>
        <div className="flex items-center gap-2 mt-3 relative z-10 flex-wrap">
          <span className="text-xs text-white/80 font-medium">{getSavingsRate(income, expenses).toFixed(0)}% saved</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs text-white/70">{transactions.length} txns</span>
        </div>
      </div>

      {/* Income */}
      <div className="summary-card bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-5 flex items-start gap-4 card-hover shine-hover" style={{ animationDelay: '0.08s' }}>
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0 transition-all duration-300 hover:scale-110 hover:rotate-6">
          <ArrowUpRight size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-dim">Total Income</p>
          <p className="text-2xl font-bold text-ink mt-1">
            <AnimatedNumber value={income} formatter={v => formatCurrency(v)} />
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {transactions.filter(t => t.type === "income").length} items
              </p>
              {comparison.priorIncome > 0 && <ChangeBadge pct={comparison.incomePctChange} />}
            </div>
            {incSpark && <Sparkline data={incSpark} color="#10b981" />}
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="summary-card bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-5 flex items-start gap-4 card-hover shine-hover" style={{ animationDelay: '0.16s' }}>
        <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/40 shrink-0 transition-all duration-300 hover:scale-110 hover:rotate-6">
          <ArrowDownLeft size={20} className="text-rose-600 dark:text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-dim">Total Expenses</p>
          <p className="text-2xl font-bold text-ink mt-1">
            <AnimatedNumber value={expenses} formatter={v => formatCurrency(v)} />
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {transactions.filter(t => t.type === "expense").length} items
              </p>
              {comparison.priorExpenses > 0 && <ChangeBadge pct={comparison.expensePctChange} />}
            </div>
            {expSpark && <Sparkline data={expSpark} color="#f43f5e" />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chart data helpers ───────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEED_CHART = [
  { month: "Nov", income: 5600, expense: 4015 },
  { month: "Dec", income: 5800, expense: 4650 },
  { month: "Jan", income: 6250, expense: 4615 },
  { month: "Feb", income: 5700, expense: 3905 },
  { month: "Mar", income: 6000, expense: 4890 },
  { month: "Apr", income: 6000, expense: 3805 },
];

function BalanceChart({ transactions, theme }) {
  const chartData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.date), k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
      if (!map[k]) map[k] = { month: MONTHS[d.getMonth()], income: 0, expense: 0 };
      if (t.type === "income") map[k].income += t.amount;
      else map[k].expense += t.amount;
    });
    const real = Object.keys(map).sort().map(k => map[k]);
    return real.length >= 3 ? real.slice(-8) : [...SEED_CHART, ...real].slice(-8);
  }, [transactions]);

  const comparison = useMemo(() => getMonthComparison(transactions), [transactions]);
  const isExpDown = comparison.expensePctChange <= 0;
  const isDark = theme === "dark";
  const gridClr = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const axisClr = isDark ? "#6b7280" : "#9ca3af";

  return (
    <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-5 h-full card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Statistics</h2>
          <p className="text-xs text-dim mt-0.5">Income vs expenses over time</p>
          {comparison.priorExpenses > 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium bounce-in ${isExpDown ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
              {isExpDown ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              Expenses {isExpDown ? "down" : "up"} {Math.abs(comparison.expensePctChange).toFixed(1)}% vs last month
            </div>
          )}
        </div>
        <span className="text-xs text-dim border border-border rounded-lg px-2.5 py-1.5 font-medium cursor-default hover:bg-border/30 transition-all">Monthly</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridClr} strokeDasharray="4 0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: axisClr, fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fill: axisClr, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload, label }) =>
              !active || !payload?.length ? null : (
                <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-pop px-4 py-3 text-sm min-w-[160px] scale-in">
                  <p className="font-semibold text-ink mb-2">{label}</p>
                  {payload.map(p => (
                    <div key={p.dataKey} className="flex justify-between gap-4 mt-1">
                      <span className="capitalize text-dim">{p.dataKey}</span>
                      <span className="font-semibold" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              )
            }
          />
          <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-dim capitalize ml-1">{v}</span>} />
          <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#incGrad)" dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981", style: { filter: 'drop-shadow(0 0 8px #10b981)' } }} />
          <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fill="url(#expGrad)" dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: "#f43f5e", style: { filter: 'drop-shadow(0 0 8px #f43f5e)' } }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const COLORS = ["#10b981","#3b82f6","#f59e0b","#f43f5e","#8b5cf6","#06b6d4"];

function SpendingChart({ transactions }) {
  const { slices, total } = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]);
    const tot = sorted.reduce((s,[,v]) => s+v, 0);
    const top4 = sorted.slice(0,4), rest = sorted.slice(4);
    if (rest.length) top4.push(["Other", rest.reduce((s,[,v]) => s+v, 0)]);
    return { slices: top4.map(([n,v]) => ({ name: n, value: v })), total: tot };
  }, [transactions]);

  return (
    <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-5 flex flex-col h-full card-hover">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">Spending Breakdown</h2>
        <p className="text-xs text-dim mt-0.5">Expenses by category</p>
      </div>
      {slices.length === 0 ? (
        <EmptyState title="No expenses yet" description="Add expense transactions." icon={<PieIcon size={24} className="text-dim" />} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={slices} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3}
                dataKey="value" strokeWidth={0} isAnimationActive animationBegin={200} animationDuration={900}
                label={() => (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
                    <tspan x="50%" dy="-8" fontSize="11" fill="var(--color-dim,#9ca3af)">Total</tspan>
                    <tspan x="50%" dy="18" fontSize="13" fontWeight="700" fill="currentColor">{formatCurrency(total)}</tspan>
                  </text>
                )}
                labelLine={false}
              >
                {slices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ cursor: 'pointer' }} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  !active || !payload?.length ? null : (
                    <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-pop px-3 py-2.5 text-sm scale-in">
                      <p className="font-semibold text-ink">{payload[0].payload.name}</p>
                      <p className="text-dim mt-0.5">{formatCurrency(payload[0].payload.value)} · {total > 0 ? Math.round((payload[0].payload.value / total) * 100) : 0}%</p>
                    </div>
                  )
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2.5 stagger-children">
            {slices.map((s, i) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.name} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-ink flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-dim tabular-nums">{formatCurrency(s.value)}</span>
                    <span className="text-xs font-semibold text-ink w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-border/50 rounded-full overflow-hidden ml-4">
                    <div
                      className="h-full rounded-full progress-bar-animated"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], animationDelay: `${0.3 + i * 0.08}s`, boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}55` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Mini radial gauge (for savings rate) ─────────────────────────────────────
function MiniGauge({ pct, color }) {
  const r = 26, arc = Math.PI * r;
  const offset = arc - (Math.min(pct, 100) / 100) * arc;
  return (
    <svg width={64} height={36} viewBox="0 0 64 36" className="overflow-visible">
      <path d="M 5,33 A 27,27 0 0 1 59,33" fill="none" stroke="hsl(var(--border))" strokeWidth="5" strokeLinecap="round" />
      <path d="M 5,33 A 27,27 0 0 1 59,33" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s', filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

// ── Insights Grid — full redesign ─────────────────────────────────────────────
function InsightsGrid({ transactions }) {
  const stats = useMemo(() => {
    if (!transactions.filter(t => t.type === "expense").length) return null;
    const { income, expenses } = getTotals(transactions);
    return {
      top: getTopCategory(transactions),
      avg: getAverageExpense(transactions),
      big: getBiggestExpense(transactions),
      frequent: getMostFrequentCategory(transactions),
      savings: getSavingsRate(income, expenses),
      comparison: getMonthComparison(transactions),
      income, expenses,
    };
  }, [transactions]);

  if (!stats) return (
    <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm scale-in">
      <EmptyState title="No insights yet" description="Add some expenses." />
    </div>
  );

  const isExpUp = stats.comparison.expensePctChange >= 0;
  const savingsGood = stats.savings > 0;
  const savingsColor = stats.savings >= 30 ? '#10b981' : stats.savings > 0 ? '#f59e0b' : '#f43f5e';

  // Category spend ratio for top spending bar
  const topPct = stats.top?.pct ?? 0;

  // Most frequent frequency visual (dots)
  const freqDots = Math.min(stats.frequent?.count ?? 0, 10);

  return (
    <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-6 fade-up-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-ink">Financial Insights</h2>
          <p className="text-xs text-dim mt-0.5">Patterns from your data</p>
        </div>
        <span className="text-xs text-dim border border-border rounded-lg px-2.5 py-1 font-medium cursor-default hover:bg-border/30 transition-all">All time</span>
      </div>

      {/* Grid: 2 cols top row (wide cards), 4 cols bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">

        {/* ── TOP SPENDING (wide) */}
        <div className="sm:col-span-2 lg:col-span-1 group bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/25 dark:to-purple-900/15 border border-violet-200/60 dark:border-violet-700/30 rounded-2xl p-5 cursor-default insight-tile">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <ShoppingCart size={15} className="text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-[10px] font-bold text-violet-600/70 dark:text-violet-400/70 uppercase tracking-widest">Top Spending</span>
            </div>
            <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100/80 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">{topPct}% of expenses</span>
          </div>
          <p className="text-2xl font-extrabold text-ink tracking-tight mb-0.5 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors duration-200">{stats.top?.name ?? '—'}</p>
          <p className="text-sm font-semibold text-dim mb-3">{stats.top ? formatCurrency(stats.top.total) : ''}</p>
          {/* Progress bar */}
          <div className="h-2 bg-violet-100 dark:bg-violet-900/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-bar-animated"
              style={{ width: `${topPct}%`, background: 'linear-gradient(90deg, #8b5cf6, #a855f7)', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }}
            />
          </div>
          <p className="text-[10px] text-dim/60 mt-1.5">{topPct}% of total spend</p>
        </div>

        {/* ── SAVINGS RATE (with mini gauge) */}
        <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/25 dark:to-teal-900/15 border border-emerald-200/60 dark:border-emerald-700/30 rounded-2xl p-5 cursor-default insight-tile flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <PiggyBank size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">Savings Rate</span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-4xl font-black text-ink tracking-tighter leading-none" style={{ color: savingsColor }}>
                {Math.abs(stats.savings).toFixed(0)}<span className="text-2xl font-extrabold">%</span>
              </p>
              <p className={`text-xs font-bold mt-1.5 ${savingsGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {stats.savings >= 30 ? '🎉 Excellent' : stats.savings > 0 ? '📈 Keep going' : '⚠ Budget exceeded'}
              </p>
            </div>
            <MiniGauge pct={Math.abs(stats.savings)} color={savingsColor} />
          </div>
        </div>

        {/* ── MONTH TREND */}
        <div className={`group border rounded-2xl p-5 cursor-default insight-tile flex flex-col justify-between ${
          isExpUp
            ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/25 dark:to-red-900/15 border-rose-200/60 dark:border-rose-700/30'
            : 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/25 dark:to-green-900/15 border-emerald-200/60 dark:border-emerald-700/30'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${isExpUp ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
              {isExpUp ? <TrendingUp size={15} className="text-rose-600 dark:text-rose-400" /> : <TrendingDown size={15} className="text-emerald-600 dark:text-emerald-400" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isExpUp ? 'text-rose-600/70 dark:text-rose-400/70' : 'text-emerald-600/70 dark:text-emerald-400/70'}`}>Month Trend</span>
          </div>
          <div className="mt-3">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black tracking-tighter leading-none" style={{ color: isExpUp ? '#f43f5e' : '#10b981' }}>
                {isExpUp ? '+' : ''}{Math.abs(stats.comparison.expensePctChange).toFixed(1)}
              </span>
              <span className="text-xl font-bold mb-1" style={{ color: isExpUp ? '#f43f5e' : '#10b981' }}>%</span>
              <span className="text-3xl mb-0.5">{isExpUp ? '📈' : '📉'}</span>
            </div>
            <p className="text-xs text-dim mt-1">expenses vs last month</p>
            <p className={`text-xs font-bold mt-1 ${isExpUp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isExpUp ? 'Spending increased — review budget' : 'Great — you reduced spending!'}
            </p>
          </div>
        </div>

        {/* ── AVG EXPENSE */}
        <div className="group bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/25 dark:to-blue-900/15 border border-sky-200/60 dark:border-sky-700/30 rounded-2xl p-5 cursor-default insight-tile">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <CreditCard size={15} className="text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-[10px] font-bold text-sky-600/70 dark:text-sky-400/70 uppercase tracking-widest">Avg Expense</span>
          </div>
          <p className="text-3xl font-black text-ink tracking-tight leading-none">{formatCurrency(stats.avg)}</p>
          <p className="text-xs text-dim mt-1.5">per transaction</p>
          {/* Mini visual bar comparing avg to biggest */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-dim mb-1">
              <span>Avg</span>
              <span>Max: {stats.big ? formatCurrency(stats.big.amount) : '—'}</span>
            </div>
            <div className="h-1.5 bg-sky-100 dark:bg-sky-900/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-bar-animated"
                style={{
                  width: stats.big ? `${Math.min(100,(stats.avg / stats.big.amount) * 100).toFixed(0)}%` : '50%',
                  background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                  boxShadow: '0 0 6px rgba(14,165,233,0.4)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── BIGGEST SPEND */}
        <div className="group bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/25 dark:to-amber-900/15 border border-orange-200/60 dark:border-orange-700/30 rounded-2xl p-5 cursor-default insight-tile">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Zap size={15} className="text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest">Biggest Spend</span>
          </div>
          <p className="text-3xl font-black text-ink tracking-tight leading-none">{stats.big ? formatCurrency(stats.big.amount) : '—'}</p>
          {stats.big && (
            <>
              <p className="text-sm font-semibold text-dim mt-1 truncate">{stats.big.description}</p>
              <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400">
                {stats.big.category}
              </span>
            </>
          )}
        </div>

        {/* ── MOST FREQUENT */}
        <div className="group bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/25 dark:to-cyan-900/15 border border-teal-200/60 dark:border-teal-700/30 rounded-2xl p-5 cursor-default insight-tile">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Repeat size={15} className="text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-bold text-teal-600/70 dark:text-teal-400/70 uppercase tracking-widest">Most Frequent</span>
          </div>
          <p className="text-2xl font-black text-ink tracking-tight leading-none truncate">{stats.frequent?.name ?? '—'}</p>
          <p className="text-xs text-dim mt-1">{stats.frequent ? `${stats.frequent.count} transactions` : ''}</p>
          {/* Frequency dot row */}
          {freqDots > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 group-hover:scale-125 ${i < freqDots ? 'bg-teal-500 dark:bg-teal-400' : 'bg-teal-100 dark:bg-teal-900/40'}`}
                  style={{ transitionDelay: `${i * 30}ms` }}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


// ── Monthly Expense Forecast ───────────────────────────────────────────────────
function ExpenseForecast({ transactions }) {
  const forecast = useMemo(() => {
    const now = new Date();
    const yr = now.getFullYear(), mo = now.getMonth();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === yr && d.getMonth() === mo;
    });
    const spent = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const earned = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    if (spent === 0) return null;
    const day = now.getDate();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const daysLeft = daysInMonth - day;
    const daily = spent / day;
    const projected = Math.round(daily * daysInMonth);
    const isOnTrack = earned === 0 || projected <= earned;
    return { spent, earned, projected, daily, day, daysInMonth, daysLeft, isOnTrack };
  }, [transactions]);

  if (!forecast) return null;

  const timePct = Math.round((forecast.day / forecast.daysInMonth) * 100);
  const spendPct = forecast.earned > 0
    ? Math.min(100, Math.round((forecast.spent / forecast.earned) * 100))
    : Math.min(100, Math.round((forecast.spent / forecast.projected) * 100));

  return (
    <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl p-5 card-hover shine-hover fade-up-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Monthly Forecast</h2>
          <p className="text-xs text-dim mt-0.5">{forecast.daysLeft} days left in {new Date().toLocaleString('default', { month: 'long' })}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full bounce-in ${
          forecast.isOnTrack
            ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
            : 'text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30'
        }`}>
          {forecast.isOnTrack ? '✓ On Track' : '⚠ Over Budget'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Spent So Far',     value: formatCurrency(forecast.spent),     neutral: true },
          { label: 'Projected Total',  value: formatCurrency(forecast.projected),  good: forecast.isOnTrack },
          { label: 'Daily Rate',       value: formatCurrency(forecast.daily),      neutral: true },
        ].map(({ label, value, good, neutral }) => (
          <div key={label} className="text-center p-3 rounded-xl bg-bg/60 border border-border/30 hover:scale-105 transition-all duration-200 cursor-default">
            <p className="text-[10px] font-bold text-dim tracking-widest uppercase">{label}</p>
            <p className={`text-base font-extrabold mt-1.5 tabular-nums ${
              neutral ? 'text-ink'
              : good  ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
            }`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-dim">
          <span>Day {forecast.day} of {forecast.daysInMonth}</span>
          <span>{timePct}% through month · {spendPct}% of income spent</span>
        </div>
        <div className="h-3 bg-border/30 rounded-full overflow-hidden relative">
          {/* Time progress (faint) */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-400/20 rounded-full"
            style={{ width: `${timePct}%`, transition: 'width 1s ease' }}
          />
          {/* Spend progress */}
          <div
            className={`absolute inset-y-0 left-0 rounded-full progress-bar-animated ${
              forecast.isOnTrack ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${spendPct}%`, opacity: 0.8 }}
          />
          {/* Today marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white/60 shadow"
            style={{ left: `${timePct}%` }}
          />
        </div>
        <p className="text-xs text-dim leading-relaxed">
          At this rate, you'll spend{' '}
          <span className={`font-bold ${
            forecast.isOnTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(forecast.projected)}
          </span>
          {' '}by month end
          {forecast.earned > 0 && (
            <> — {forecast.isOnTrack ? 'within' : 'exceeding'} your{' '}
              <span className="font-semibold text-ink">{formatCurrency(forecast.earned)}</span> income
            </>
          )}.
        </p>
      </div>
    </div>
  );
}

// ── Holographic Wallet Card ───────────────────────────────────────────────────
function WalletCard({ balance }) {
  const cardRef = useRef(null);

  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 20, ry = (px - 0.5) * 20;
    el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.04)`;
    el.style.boxShadow = `${-ry * 2}px ${rx * 2}px 50px rgba(37,99,235,0.45)`;
    // Holographic custom properties
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.style.setProperty('--mx-deg', `${px * 180}`);
    const shine = el.querySelector('.holo-shine');
    const rainbow = el.querySelector('.holo-rainbow');
    if (shine) shine.style.opacity = '1';
    if (rainbow) rainbow.style.opacity = '1';
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) scale(1)';
    el.style.boxShadow = '';
    const shine = el.querySelector('.holo-shine');
    const rainbow = el.querySelector('.holo-rainbow');
    if (shine) shine.style.opacity = '0';
    if (rainbow) rainbow.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="holo-card rounded-[20px] p-5 text-white cursor-pointer select-none"
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 45%, #1e40af 100%)',
        transition: 'transform 0.12s ease, box-shadow 0.25s ease',
      }}
    >
      <div className="holo-shine" />
      <div className="holo-rainbow" />

      {/* Card top */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="w-9 h-6 bg-[#f8d070]/90 rounded-[4px] flex items-center justify-center">
          <CreditCard size={14} className="text-[#a47b2c] ml-0.5" />
        </div>
        <span className="font-[800] text-[13px] tracking-tight italic flex items-center gap-1">
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full" />
          </div>{" "}XXXX-XX99
        </span>
      </div>

      {/* Balance */}
      <div className="relative z-10">
        <p className="text-white/75 text-[11px] font-medium flex items-center gap-1.5">
          Balance <span className="w-3.5 h-3.5 flex items-center justify-center border border-white/40 rounded-full text-xs">👁</span>
        </p>
        <p className="text-2xl font-extrabold tracking-tight mt-0.5">
          <AnimatedNumber value={balance} formatter={v => formatCurrency(v)} />
        </p>
      </div>

      <div className="relative z-10 mt-3 flex justify-end">
        <span className="font-black text-[14px] italic tracking-wider">VISA</span>
      </div>
    </div>
  );
}

// ── Wallet Panel ──────────────────────────────────────────────────────────────
const WalletPanel = ({ transactions }) => {
  const { balance } = getTotals(transactions);
  return (
    <div className="w-full shrink-0 flex flex-col gap-5 fade-up">
      <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink">Wallet</h2>
          <button className="text-dim hover:text-ink transition-all duration-200 hover:scale-110 hover:rotate-90">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <WalletCard balance={balance} />
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-4 h-1.5 bg-ink rounded-full" />
          <div className="w-1.5 h-1.5 bg-border rounded-full" />
          <div className="w-1.5 h-1.5 bg-border rounded-full" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface/70 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm p-5 flex-1 fade-up-1">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink">Recent Activity</h2>
          <button className="text-xs text-brand font-medium hover:text-brand/80 transition-colors animated-link">View all</button>
        </div>
        <div className="space-y-4 stagger-children">
          {transactions.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center gap-3.5 group cursor-default">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[14px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                t.type === "income" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600" : "bg-rose-50 dark:bg-rose-900/40 text-rose-600"
              }`}>
                {t.description.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink truncate group-hover:text-brand transition-colors duration-200">{t.description}</p>
                <p className="text-[11px] text-dim capitalize mt-0.5">{t.category}</p>
              </div>
              <div className="text-right">
                <p className={`text-[13px] font-bold tabular-nums ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {t.type === "income" ? "+" : ""}{formatCurrency(t.amount)}
                </p>
                <p className="text-[10px] text-dim mt-0.5">{formatDate(t.date)}</p>
              </div>
            </div>
          ))}
          {!transactions.length && <p className="text-xs text-dim text-center py-4">No recent activity.</p>}
        </div>
      </div>
    </div>
  );
};

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 scale-in">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-brand border-t-transparent spin-loader" />
      </div>
      <p className="text-sm text-dim font-medium fade-up-1">Loading your data…</p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { transactions, loading, theme } = useFinance();
  const insight = useMemo(() => getInsightSentence(transactions), [transactions]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* Health Score — the standout feature */}
      <HealthScore transactions={transactions} />

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Center */}
        <div className="flex-1 space-y-5 min-w-0">
          <SummaryCards transactions={transactions} />

          {/* Expense Forecast — unique data insight */}
          <ExpenseForecast transactions={transactions} />

          {insight && (
            <div className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl px-4 py-3.5 fade-up-1 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-[1.005]">
              <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5 sparkle-animate" />
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                <TypedInsight text={insight} />
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 fade-up-2">
            <div className="lg:col-span-2">
              <BalanceChart transactions={transactions} theme={theme} />
            </div>
            <div>
              <SpendingChart transactions={transactions} />
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="w-full xl:w-[310px] 2xl:w-[330px] shrink-0">
          <WalletPanel transactions={transactions} />
        </div>
      </div>

      <InsightsGrid transactions={transactions} />
    </div>
  );
}
