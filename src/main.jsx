import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { FinanceProvider } from "./data.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </StrictMode>,
);
