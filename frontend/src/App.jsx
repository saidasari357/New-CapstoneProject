import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { createExpense, deleteExpense, fetchExpenses } from "./api";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CATEGORIES = ["Food", "Utilities", "Transport", "Shopping", "Health", "Other"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: CATEGORIES[0],
    spentAt: new Date().toISOString().slice(0, 10)
  });

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const totalSpent = useMemo(
    () => expenses.reduce((acc, item) => acc + Number(item.amount), 0),
    [expenses]
  );

  const byCategory = useMemo(() => {
    const bucket = {};
    for (const entry of expenses) {
      bucket[entry.category] = (bucket[entry.category] || 0) + Number(entry.amount);
    }
    return bucket;
  }, [expenses]);

  const categoryChartData = {
    labels: Object.keys(byCategory),
    datasets: [
      {
        data: Object.values(byCategory),
        backgroundColor: ["#004e64", "#00a5cf", "#9fffcb", "#25a18e", "#7ae582", "#ffbf69"]
      }
    ]
  };

  const recentBarData = {
    labels: expenses.slice(0, 6).map((item) => item.title),
    datasets: [
      {
        label: "Amount",
        data: expenses.slice(0, 6).map((item) => item.amount),
        backgroundColor: "#004e64"
      }
    ]
  };

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await createExpense({ ...form, amount: Number(form.amount) });
      setForm({ ...form, title: "", amount: "" });
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    try {
      setError("");
      await deleteExpense(id);
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="layout">
      <section className="hero">
        <h1>Expense Recorder</h1>
        <p>Track spending, view category split, and monitor recent expenses in simple charts.</p>
        <div className="metric-card">
          <span>Total spent</span>
          <strong>{formatCurrency(totalSpent)}</strong>
        </div>
      </section>

      <section className="content-grid">
        <article className="card">
          <h2>Add Expense</h2>
          <form onSubmit={onSubmit} className="form-grid">
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Office lunch"
              />
            </label>
            <label>
              Amount
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Spent Date
              <input
                required
                type="date"
                value={form.spentAt}
                onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add"}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </article>

        <article className="card">
          <h2>Category Split</h2>
          {loading ? <p>Loading...</p> : <Doughnut data={categoryChartData} />}
        </article>

        <article className="card">
          <h2>Recent Expense Bars</h2>
          {loading ? <p>Loading...</p> : <Bar data={recentBarData} />}
        </article>

        <article className="card">
          <h2>Latest Entries</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="expense-list">
              {expenses.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.category} | {item.spentAt}
                    </small>
                  </div>
                  <div className="amount-group">
                    <span>{formatCurrency(item.amount)}</span>
                    <button onClick={() => onDelete(item.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
