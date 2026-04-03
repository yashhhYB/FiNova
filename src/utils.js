import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ── UI Helpers ────────────────────────────────────────────────────────────
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── Formatting ────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Calculations ──────────────────────────────────────────────────────────
export function getTotals(transactions) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export function getSavingsRate(income, expenses) {
  if (income <= 0) return 0;
  return Math.max(0, ((income - expenses) / income) * 100);
}

export function getTopCategory(transactions) {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return null;

  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  const catMap = {};
  expenses.forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
  });

  const [name, total] = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const pct = totalExp > 0 ? Math.round((total / totalExp) * 100) : 0;
  return { name, total, pct };
}

export function getInsightSentence(transactions) {
  const top = getTopCategory(transactions);
  if (!top) return null;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const incomeShare =
    totalIncome > 0 ? Math.round((top.total / totalIncome) * 100) : 0;
  return `You spent $${top.total.toLocaleString()} on ${top.name} \u2014 that's ${top.pct}% of your expenses and ${incomeShare}% of your income.`;
}

export function getMonthComparison(transactions) {
  const now = new Date();
  const thisY = now.getFullYear();
  const thisM = now.getMonth();
  const priorDate = new Date(thisY, thisM - 1, 1);
  const priorY = priorDate.getFullYear();
  const priorM = priorDate.getMonth();

  const isThisMonth = (d) =>
    d.getFullYear() === thisY && d.getMonth() === thisM;
  const isPriorMonth = (d) =>
    d.getFullYear() === priorY && d.getMonth() === priorM;

  let currentExpenses = 0;
  let priorExpenses = 0;
  let currentIncome = 0;
  let priorIncome = 0;

  transactions.forEach((t) => {
    const d = new Date(t.date);
    if (isThisMonth(d)) {
      if (t.type === "expense") currentExpenses += t.amount;
      else currentIncome += t.amount;
    } else if (isPriorMonth(d)) {
      if (t.type === "expense") priorExpenses += t.amount;
      else priorIncome += t.amount;
    }
  });

  const calcPct = (current, prior) => {
    if (prior === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - prior) / prior) * 100).toFixed(1));
  };

  return {
    expensePctChange: calcPct(currentExpenses, priorExpenses),
    incomePctChange: calcPct(currentIncome, priorIncome),
    priorExpenses,
    priorIncome,
  };
}

export function getAverageExpense(transactions) {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return 0;
  return expenses.reduce((s, t) => s + t.amount, 0) / expenses.length;
}

export function getMostFrequentCategory(transactions) {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return null;

  const freqMap = {};
  expenses.forEach((t) => {
    freqMap[t.category] = (freqMap[t.category] ?? 0) + 1;
  });
  const [name, count] = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0];
  return { name, count };
}

export function getBiggestExpense(transactions) {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return null;
  return expenses.reduce((a, b) => (a.amount > b.amount ? a : b));
}
