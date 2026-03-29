const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function fetchExpenses() {
  const response = await fetch(`${API_BASE}/api/expenses`);
  if (!response.ok) {
    throw new Error("Unable to load expenses");
  }
  return response.json();
}

export async function createExpense(payload) {
  const response = await fetch(`${API_BASE}/api/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Unable to create expense");
  }

  return response.json();
}

export async function deleteExpense(id) {
  const response = await fetch(`${API_BASE}/api/expenses/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Unable to delete expense");
  }
}
