import React, { createContext, useContext, useState, useEffect } from "react";

// ── Seed Data ─────────────────────────────────────────────────────────────
const SEED_DATA = [
  {
    id: "seed-1",
    date: "2023-11-01T00:00:00.000Z",
    amount: 5200,
    category: "Salary",
    type: "income",
    description: "Monthly Salary",
  },
  {
    id: "seed-2",
    date: "2023-11-03T00:00:00.000Z",
    amount: 1200,
    category: "Housing",
    type: "expense",
    description: "Rent Payment",
  },
  {
    id: "seed-3",
    date: "2023-11-07T00:00:00.000Z",
    amount: 320,
    category: "Groceries",
    type: "expense",
    description: "Weekly Groceries",
  },
  {
    id: "seed-4",
    date: "2023-11-10T00:00:00.000Z",
    amount: 85,
    category: "Utilities",
    type: "expense",
    description: "Internet Bill",
  },
  {
    id: "seed-9",
    date: "2023-12-01T00:00:00.000Z",
    amount: 5200,
    category: "Salary",
    type: "income",
    description: "Monthly Salary",
  },
  {
    id: "seed-10",
    date: "2023-12-02T00:00:00.000Z",
    amount: 1200,
    category: "Housing",
    type: "expense",
    description: "Rent Payment",
  },
  {
    id: "seed-11",
    date: "2023-12-08T00:00:00.000Z",
    amount: 280,
    category: "Groceries",
    type: "expense",
    description: "Supermarket Run",
  },
  {
    id: "seed-16",
    date: "2024-01-01T00:00:00.000Z",
    amount: 5500,
    category: "Salary",
    type: "income",
    description: "Monthly Salary + Bonus",
  },
  {
    id: "seed-17",
    date: "2024-01-03T00:00:00.000Z",
    amount: 1200,
    category: "Housing",
    type: "expense",
    description: "Rent Payment",
  },
  {
    id: "seed-18",
    date: "2024-01-09T00:00:00.000Z",
    amount: 310,
    category: "Groceries",
    type: "expense",
    description: "Grocery Store",
  },
  {
    id: "seed-23",
    date: "2024-02-01T00:00:00.000Z",
    amount: 5200,
    category: "Salary",
    type: "income",
    description: "Monthly Salary",
  },
  {
    id: "seed-24",
    date: "2024-02-03T00:00:00.000Z",
    amount: 1200,
    category: "Housing",
    type: "expense",
    description: "Rent Payment",
  },
  {
    id: "seed-30",
    date: "2024-03-01T00:00:00.000Z",
    amount: 5200,
    category: "Salary",
    type: "income",
    description: "Monthly Salary",
  },
  {
    id: "seed-31",
    date: "2024-03-04T00:00:00.000Z",
    amount: 1200,
    category: "Housing",
    type: "expense",
    description: "Rent Payment",
  },
  {
    id: "seed-32",
    date: "2024-03-08T00:00:00.000Z",
    amount: 340,
    category: "Groceries",
    type: "expense",
    description: "Supermarket",
  },
  {
    id: "seed-38",
    date: "2024-04-01T00:00:00.000Z",
    amount: 5200,
    category: "Salary",
    type: "income",
    description: "Monthly Salary",
  },
  {
    id: "seed-39",
    date: "2024-04-03T00:00:00.000Z",
    amount: 1200,
    category: "Housing",
    type: "expense",
    description: "Rent Payment",
  },
  {
    id: "seed-40",
    date: "2024-04-07T00:00:00.000Z",
    amount: 300,
    category: "Groceries",
    type: "expense",
    description: "Weekly Groceries",
  },
  {
    id: "seed-42",
    date: "2024-04-12T00:00:00.000Z",
    amount: 800,
    category: "Freelance",
    type: "income",
    description: "Dashboard Development",
  },
];

const STORAGE_KEY = "finance_dashboard_transactions";
const ROLE_KEY = "finance_dashboard_role";
const THEME_KEY = "color-theme";

// Simulate simple API delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Context ───────────────────────────────────────────────────────────────
const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [role, setRoleState] = useState(() => {
    const stored = window.localStorage.getItem(ROLE_KEY);
    return stored === "admin" || stored === "viewer" ? stored : "viewer";
  });

  const [theme, setTheme] = useState(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      await delay(400);
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
        setTransactions(SEED_DATA);
      } else {
        setTransactions(JSON.parse(data));
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem(ROLE_KEY, newRole);
  };

  const addTransaction = async (tx) => {
    await delay(300);
    const newTx = { ...tx, id: crypto.randomUUID() };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateTransaction = async (updatedTx) => {
    await delay(300);
    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTransaction = async (id) => {
    await delay(300);
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return React.createElement(
    FinanceContext.Provider,
    {
      value: {
        transactions,
        loading,
        role,
        theme,
        setRole,
        toggleTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
      },
    },
    children,
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinance must be used within FinanceProvider");
  return context;
};
