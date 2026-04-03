# Finova 💳 — Personal Finance Dashboard

> A production-grade, role-based personal finance dashboard built with React 18, Vite, and Tailwind CSS.

---

##  Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/finova-dashboard.git
cd finova-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:5173** in your browser. No backend or API keys required — runs fully in-browser.

> **Switch roles**: Click the **Viewer / Admin** button in the top-right navbar to toggle between read-only and full-access modes.

---

## ✨ Features

### Dashboard (Overview)
- **Summary Cards** — Net Balance, Total Income, and Total Expenses with savings rate and transaction count
- **Money Flow Chart** — Area chart showing income vs expenses over time (Recharts)
- **Spending Breakdown** — Donut/pie chart of expense categories
- **Financial Insights** — Auto-generated panels: Top Spending, Month vs Prior, Avg Expense, Savings Rate, Biggest Expense, Most Frequent Category
- **Smart Insight Banner** — Natural-language sentence summarising your top spending habit
- **Wallet Panel** — Virtual card with card number, balance, and Recent Activity feed

### Transactions
- **Search** — Real-time full-text search across description and category
- **Filter** — Toggle between All, Income, and Expense
- **Sort** — Click any column header (Date, Amount) to toggle ascending/descending
- **Export CSV** — Download all transactions as a `.csv` file
- **Desktop Table View** — Clean, dense table with sortable columns and status badges
- **Mobile Card View** — Stacked card layout optimised for small screens
- **Role-Based Actions**:
  - **Viewer**: sees a "Details" button per row
  - **Admin**: sees Edit (pencil) and Delete (trash) buttons on hover / always visible on mobile

### Add / Edit Transaction (Admin only)
- Expense / Income type toggler
- Description, Amount, Date, and Category fields
- Animated bottom-sheet modal on mobile; centred modal on desktop

---

##  Role-Based Access Control (RBAC)

| Feature             | Viewer | Admin |
|---------------------|--------|-------|
| View Dashboard      | ✅     | ✅    |
| View Transactions   | ✅     | ✅    |
| Export CSV          | ✅     | ✅    |
| Add Transaction     | ❌     | ✅    |
| Edit Transaction    | ❌     | ✅    |
| Delete Transaction  | ❌     | ✅    |

Role preference is persisted to `localStorage`.

---

##  Architecture

### File Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # All dashboard sections + Wallet panel
│   └── Transactions.jsx   # Table, cards, filters, modal
├── App.jsx                # Layout, routing, Navbar, mobile nav
├── data.js                # Context provider, localStorage API, seed data
├── utils.js               # Pure financial calculations and formatters
├── main.jsx               # Vite entry point
└── index.css              # Tailwind directives, design tokens, animations
```

### State Management

All application state lives in a single **React Context** (`FinanceContext` in `data.js`):

- `transactions` — Array of all financial records
- `role` — `'viewer'` | `'admin'`
- `theme` — `'light'` | `'dark'`
- CRUD actions: `addTransaction`, `updateTransaction`, `deleteTransaction`

This eliminates prop-drilling across the component tree while keeping the implementation dependency-free (no Redux or Zustand needed).

### Data Persistence

The "backend" is an `localStorage`-based API in `data.js`:

| Key | Purpose |
|-----|---------|
| `finance_dashboard_transactions` | Full transaction list (JSON) |
| `finance_dashboard_role` | Current RBAC role |
| `color-theme` | Light / dark preference |

On first load, if no data exists, **19 realistic seed transactions spanning 6 months** are written automatically so charts and insights have meaningful data immediately.

A simulated `delay()` creates realistic async latency for loading spinners, demonstrating real-world UX patterns.

---

##  Design System

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `hsl(220 20% 96%)` | `hsl(222 28% 8%)` |
| `--surface` | White | `hsl(222 24% 12%)` |
| `--brand` | Emerald 600 | Emerald 400 |
| Font | Inter (Google Fonts) | — |

**Custom CSS utilities** in `index.css`:
- `.fade-up` / `.fade-up-1..5` — staggered entrance animations
- `.modal-backdrop` / `.modal-content` — smooth modal open transitions
- `.skeleton` — shimmer loading placeholder
- `.wallet-gradient` — layered gradient for the virtual card
- `.hide-scrollbar` — hides scrollbar while preserving scroll

---

##  Tech Stack

| Tool | Purpose |
|------|---------|
| **React 18** | UI library |
| **Vite** | Build tool (fast HMR) |
| **Tailwind CSS v3** | Utility-first styling |
| **Recharts** | Data visualisation |
| **Lucide React** | Icon library |

---

## 📱 Responsive Behaviour

| Breakpoint | Layout |
|-----------|--------|
| `< 768px` | Single-column; hamburger menu; transaction cards |
| `768px+` | Sidebar nav + main content area |
| `1024px+` | Full 3-column layout (sidebar + content + wallet) |

---

##  Edge Cases Handled

- Empty state views on zero transactions or filtered results
- NaN / zero income guards in savings-rate calculation
- Invalid date fallbacks
- Admin-only actions hidden from Viewer via RBAC
- `localStorage` parse errors caught on boot
- Modal blocked when role is not `admin`
- Search clears via ✕ button or Escape key
