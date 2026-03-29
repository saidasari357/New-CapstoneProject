import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "expenses.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ expenses: [] }, null, 2), "utf-8");
  }
}

export function readExpenses() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  return parsed.expenses || [];
}

export function saveExpenses(expenses) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ expenses }, null, 2), "utf-8");
}
