import express from "express";
import cors from "cors";
import morgan from "morgan";
import { nanoid } from "nanoid";
import { readExpenses, saveExpenses } from "./store.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "expense-backend" });
});

app.get("/api/expenses", (req, res) => {
  const expenses = readExpenses().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(expenses);
});

app.post("/api/expenses", (req, res) => {
  const { title, amount, category, spentAt } = req.body;

  if (!title || !amount || !category || !spentAt) {
    return res.status(400).json({ error: "title, amount, category and spentAt are required" });
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const expense = {
    id: nanoid(),
    title: String(title).trim(),
    amount: numericAmount,
    category: String(category).trim(),
    spentAt,
    createdAt: new Date().toISOString()
  };

  const expenses = readExpenses();
  expenses.push(expense);
  saveExpenses(expenses);

  return res.status(201).json(expense);
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const expenses = readExpenses();
  const filtered = expenses.filter((item) => item.id !== id);

  if (filtered.length === expenses.length) {
    return res.status(404).json({ error: "Expense not found" });
  }

  saveExpenses(filtered);
  return res.status(204).send();
});

app.listen(PORT, () => {
  // Intentionally log startup to simplify AKS troubleshooting with pod logs.
  console.log(`Backend running on port ${PORT}`);
});
