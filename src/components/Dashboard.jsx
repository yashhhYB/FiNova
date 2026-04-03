import React, { useMemo } from "react";
import { useFinance } from "../data";
import {
  getTotals,
  getSavingsRate,
  getMonthComparison,
  getTopCategory,
  getAverageExpense,
  getBiggestExpense,
  getMostFrequentCategory,
  getInsightSentence,
  formatCurrency,
  formatDate,
} from "../utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShoppingCart,
  CreditCard,
  PiggyBank,
  Zap,
  Repeat,
  PieChart as PieIcon,
  Inbox,
  MoreHorizontal,
  Send,
  Download,
  FileText,
  LayoutGrid,
} from "lucide-react";

export const EmptyState = ({
  title,
  description,
  icon = <Inbox size={28} className="text-dim" />,
}) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <div className="w-14 h-14 rounded-2xl bg-border/30 flex items-center justify-center mb-1">
      {icon}
    </div>
    <p className="font-semibold text-ink text-sm">{title}</p>
    <p className="text-dim text-sm max-w-xs">{description}</p>
  </div>
);

const ChangeBadge = ({ pct }) => {
  const isPos = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isPos ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40" : "text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/40"}`}
    >
      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPos ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
};

function SummaryCards({ transactions }) {
  const { income, expenses, balance } = useMemo(
    () => getTotals(transactions),
    [transactions],
  );
  const comparison = useMemo(
    () => getMonthComparison(transactions),
    [transactions],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up">
      <div className="gradient-brand rounded-xl3 p-6 text-white relative overflow-hidden shadow-pop card-hover">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-2 w-24 h-24 rounded-full bg-white/8" />
        <p className="text-sm font-medium text-white/70 relative z-10">
          Net Balance
        </p>
        <p className="text-4xl font-extrabold mt-2 relative z-10 tracking-tight count-up">
          {formatCurrency(balance)}
        </p>
        <div className="flex items-center gap-2 mt-3 relative z-10 flex-wrap">
          <span className="text-xs text-white/80 font-medium">
            {getSavingsRate(income, expenses).toFixed(0)}% savings rate
          </span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs text-white/70">
            {transactions.length} transactions
          </span>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl3 shadow-card p-5 flex items-start gap-4 card-hover fade-up-1">
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
          <ArrowUpRight
            size={20}
            className="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-dim">Total Income</p>
          <p className="text-2xl font-bold text-ink mt-1 count-up">
            {formatCurrency(income)}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {transactions.filter((t) => t.type === "income").length} items
            </p>
            {comparison.priorIncome > 0 && (
              <ChangeBadge pct={comparison.incomePctChange} />
            )}
          </div>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl3 shadow-card p-5 flex items-start gap-4 card-hover fade-up-2">
        <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/40 shrink-0">
          <ArrowDownLeft
            size={20}
            className="text-rose-600 dark:text-rose-400"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-dim">Total Expenses</p>
          <p className="text-2xl font-bold text-ink mt-1 count-up">
            {formatCurrency(expenses)}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {transactions.filter((t) => t.type === "expense").length} items
            </p>
            {comparison.priorExpenses > 0 && (
              <ChangeBadge pct={comparison.expensePctChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
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
    transactions.forEach((t) => {
      const d = new Date(t.date),
        key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map[key])
        map[key] = { month: MONTHS[d.getMonth()], income: 0, expense: 0 };
      if (t.type === "income") map[key].income += t.amount;
      else map[key].expense += t.amount;
    });
    const real = Object.keys(map)
      .sort()
      .map((k) => map[k]);
    return real.length >= 3
      ? real.slice(-8)
      : [...SEED_CHART, ...real].slice(-8);
  }, [transactions]);
  const comparison = useMemo(
    () => getMonthComparison(transactions),
    [transactions],
  );
  const isExpDown = comparison.expensePctChange <= 0;
  const isDark = theme === "dark",
    gridClr = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    axisClr = isDark ? "#6b7280" : "#9ca3af";

  return (
    <div className="bg-surface border border-border rounded-xl3 shadow-card p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Statistics</h2>
          <p className="text-xs text-dim mt-0.5">
            Income vs expenses over time
          </p>
          {comparison.priorExpenses > 0 && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${isExpDown ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {isExpDown ? (
                <TrendingDown size={12} />
              ) : (
                <TrendingUp size={12} />
              )}
              Expenses {isExpDown ? "down" : "up"}{" "}
              {Math.abs(comparison.expensePctChange).toFixed(1)}% vs last month
            </div>
          )}
        </div>
        <span className="text-xs text-dim border border-border rounded-lg px-2.5 py-1.5 font-medium shrink-0">
          Monthly
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={gridClr}
            strokeDasharray="4 0"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: axisClr, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fill: axisClr, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              !active || !payload?.length ? null : (
                <div className="bg-surface border border-border rounded-xl shadow-pop px-4 py-3 text-sm min-w-[160px]">
                  <p className="font-semibold text-ink mb-2">{label}</p>
                  {payload.map((p) => (
                    <div
                      key={p.dataKey}
                      className="flex justify-between gap-4 mt-1"
                    >
                      <span className="capitalize text-dim">{p.dataKey}</span>
                      <span
                        className="font-semibold"
                        style={{ color: p.color }}
                      >
                        {formatCurrency(p.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => (
              <span className="text-xs text-dim capitalize ml-1">{v}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#incGrad)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#f43f5e"
            strokeWidth={2.5}
            fill="url(#expGrad)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: "#f43f5e" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
];
function SpendingChart({ transactions }) {
  const { slices, total } = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]),
      tot = sorted.reduce((s, [, v]) => s + v, 0);
    const top4 = sorted.slice(0, 4),
      rest = sorted.slice(4);
    if (rest.length > 0)
      top4.push(["Other", rest.reduce((s, [, v]) => s + v, 0)]);
    return {
      slices: top4.map(([n, v]) => ({ name: n, value: v })),
      total: tot,
    };
  }, [transactions]);

  return (
    <div className="bg-surface border border-border rounded-xl3 shadow-card p-5 flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">Spending Breakdown</h2>
        <p className="text-xs text-dim mt-0.5">Expenses by category</p>
      </div>
      {slices.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add expense transactions."
          icon={<PieIcon size={24} className="text-dim" />}
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                label={() => (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    <tspan
                      x="50%"
                      dy="-8"
                      fontSize="11"
                      fill="var(--color-dim, #9ca3af)"
                    >
                      Total
                    </tspan>
                    <tspan
                      x="50%"
                      dy="18"
                      fontSize="13"
                      fontWeight="700"
                      fill="currentColor"
                    >
                      {formatCurrency(total)}
                    </tspan>
                  </text>
                )}
                labelLine={false}
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  !active || !payload?.length ? null : (
                    <div className="bg-surface border border-border rounded-xl shadow-pop px-3 py-2.5 text-sm">
                      <p className="font-semibold text-ink">
                        {payload[0].payload.name}
                      </p>
                      <p className="text-dim mt-0.5">
                        {formatCurrency(payload[0].payload.value)} ·{" "}
                        {total > 0
                          ? Math.round((payload[0].payload.value / total) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  )
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2.5">
            {slices.map((s, i) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm text-ink flex-1 truncate">
                      {s.name}
                    </span>
                    <span className="text-xs text-dim tabular-nums">
                      {formatCurrency(s.value)}
                    </span>
                    <span className="text-xs font-semibold text-ink w-8 text-right tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1 bg-border/50 rounded-full overflow-hidden ml-4">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: COLORS[i % COLORS.length],
                      }}
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

function InsightsGrid({ transactions }) {
  const stats = useMemo(() => {
    if (transactions.filter((t) => t.type === "expense").length === 0)
      return null;
    const { income, expenses } = getTotals(transactions);
    return {
      top: getTopCategory(transactions),
      avg: getAverageExpense(transactions),
      big: getBiggestExpense(transactions),
      frequent: getMostFrequentCategory(transactions),
      savings: getSavingsRate(income, expenses),
      comparison: getMonthComparison(transactions),
    };
  }, [transactions]);

  if (!stats)
    return (
      <div className="bg-surface border border-border rounded-xl3 shadow-card fade-up fade-up-3">
        <EmptyState title="No insights yet" description="Add some expenses." />
      </div>
    );
  const savingsGood = stats.savings > 0,
    isExpUp = stats.comparison.expensePctChange >= 0;

  const tiles = [
    {
      label: "TOP SPENDING",
      value: stats.top?.name ?? "—",
      sub: stats.top
        ? `${formatCurrency(stats.top.total)} · ${stats.top.pct}% of expenses`
        : "",
      Icon: ShoppingCart,
      clr: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/30",
      accent: "border-violet-300 dark:border-violet-700",
    },
    {
      label: "MONTH VS PRIOR",
      value: `${isExpUp ? "+" : ""}${stats.comparison.expensePctChange.toFixed(1)}%`,
      sub: `Expenses vs last month`,
      Icon: isExpUp ? TrendingUp : TrendingDown,
      clr: isExpUp
        ? "text-rose-600 dark:text-rose-400"
        : "text-emerald-600 dark:text-emerald-400",
      bg: isExpUp
        ? "bg-rose-50 dark:bg-rose-900/30"
        : "bg-emerald-50 dark:bg-emerald-900/30",
      accent: isExpUp
        ? "border-rose-300 dark:border-rose-700"
        : "border-emerald-300 dark:border-emerald-700",
    },
    {
      label: "AVG EXPENSE",
      value: formatCurrency(stats.avg),
      sub: "per transaction",
      Icon: CreditCard,
      clr: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-900/30",
      accent: "border-sky-300 dark:border-sky-700",
    },
    {
      label: "SAVINGS RATE",
      value: `${Math.abs(stats.savings).toFixed(0)}%`,
      sub:
        stats.savings > 30
          ? "Excellent! 🎉"
          : stats.savings > 0
            ? "Room to improve"
            : "Budget exceeded",
      Icon: PiggyBank,
      clr: savingsGood
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400",
      bg: savingsGood
        ? "bg-emerald-50 dark:bg-emerald-900/30"
        : "bg-rose-50 dark:bg-rose-900/30",
      accent: savingsGood
        ? "border-emerald-300 dark:border-emerald-700"
        : "border-rose-300 dark:border-rose-700",
    },
    {
      label: "BIGGEST EXPENSE",
      value: stats.big ? formatCurrency(stats.big.amount) : "—",
      sub: stats.big?.description ?? "",
      Icon: Zap,
      clr: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/30",
      accent: "border-rose-300 dark:border-rose-700",
    },
    {
      label: "MOST FREQUENT",
      value: stats.frequent?.name ?? "—",
      sub: stats.frequent ? `${stats.frequent.count} items` : "",
      Icon: Repeat,
      clr: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-900/30",
      accent: "border-teal-300 dark:border-teal-700",
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl3 shadow-card p-6 fade-up-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Financial Insights
          </h2>
          <p className="text-xs text-dim mt-0.5">Patterns from your history</p>
        </div>
        <span className="text-xs text-dim border border-border rounded-lg px-2.5 py-1 font-medium">
          All time
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {tiles.map(({ label, value, sub, Icon, clr, bg, accent }) => (
          <div
            key={label}
            className={`flex items-start gap-3 p-3 rounded-xl border-l-2 ${accent} bg-bg/40 group transition-all hover:bg-bg/80`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${bg}`}
            >
              <Icon size={15} className={clr} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-dim tracking-widest">
                {label}
              </p>
              <p className="text-sm font-bold text-ink mt-1 truncate">
                {value}
              </p>
              <p className="text-[11px] text-dim mt-0.5 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const WalletPanel = ({ transactions }) => {
  const { balance } = getTotals(transactions);
  return (
    <div className="w-full shrink-0 flex flex-col gap-6 fade-up">
      <div className="bg-surface border border-border rounded-xl3 shadow-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink">Wallet</h2>
          <button className="text-dim hover:text-ink">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Credit Card */}
        <div className="wallet-gradient rounded-[18px] p-5 text-white shadow-pop hover:scale-[1.01] transition-transform duration-300">
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-9 h-6 bg-[#f8d070] bg-opacity-90 rounded-[4px] flex items-center justify-center opacity-90">
              <CreditCard size={14} className="text-[#a47b2c] ml-0.5" />
            </div>
            <span className="font-[800] text-[13px] tracking-tight italic flex items-center gap-1">
              <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full"></div>
              </div>{" "}
              XXXX-XX99
            </span>
          </div>
          <div className="relative z-10 flex flex-col gap-0.5">
            <p className="text-white/80 text-[11px] font-medium flex items-center gap-1.5">
              Balance{" "}
              <span className="w-3.5 h-3.5 flex items-center justify-center border border-white/40 rounded-full text-xs">
                👁
              </span>
            </p>
            <p className="text-2xl font-extrabold tracking-tight mt-0.5">
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="relative z-10 mt-3 mb-1 flex justify-end">
            <span className="font-bold text-[14px] italic">VISA</span>
          </div>
        </div>

        {/* Progress dot indicator */}
        <div className="flex justify-center gap-1.5 mt-4 mb-2">
          <div className="w-4 h-1.5 bg-ink rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-border rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-border rounded-full"></div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-border rounded-xl3 shadow-card p-5 flex-1 fade-up-1">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink">Recent Activity</h2>
          <button className="text-xs text-brand font-medium hover:text-brand/80 transition-colors">
            View all
          </button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-center gap-3.5 group">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[14px] ${t.type === "income" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600" : "bg-rose-50 dark:bg-rose-900/40 text-rose-600"}`}
              >
                {t.description.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink truncate group-hover:text-brand transition-colors">
                  {t.description}
                </p>
                <p className="text-[11px] text-dim capitalize mt-0.5">
                  {t.category}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-[13px] font-bold ${t.type === "income" ? "text-ink" : "text-ink"}`}
                >
                  {t.type === "income" ? "+" : ""}
                  {formatCurrency(t.amount)}
                </p>
                <p className="text-[10px] text-dim mt-0.5">
                  {formatDate(t.date)}
                </p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-xs text-dim text-center py-4">
              No recent activity.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export function Dashboard() {
  const { transactions, loading, theme } = useFinance();
  const insight = useMemo(
    () => getInsightSentence(transactions),
    [transactions],
  );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Center Content - Old Design */}
        <div className="flex-1 space-y-6 min-w-0">
          <SummaryCards transactions={transactions} />
          {insight && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl2 px-4 py-3 fade-up-1">
              <Sparkles
                size={15}
                className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                {insight}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up-2">
            <div className="lg:col-span-2">
              <BalanceChart transactions={transactions} theme={theme} />
            </div>
            <div>
              <SpendingChart transactions={transactions} />
            </div>
          </div>
        </div>

        {/* Wallet Right View */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0">
          <WalletPanel transactions={transactions} />
        </div>
      </div>

      <InsightsGrid transactions={transactions} />
    </div>
  );
}
