const API_URL = "http://localhost:3001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }

  return data;
}

export function listOrders() {
  return request("/orders?status=open");
}

export function getStockBars(symbol = "AAPL") {
  return request(`/market-data/${encodeURIComponent(symbol)}/bars`);
}

export function submitOrder(order) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export function cancelOrder(orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });
}