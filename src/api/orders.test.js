import { cancelOrder, getStockBars, submitOrder } from "./orders";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

test("submits orders through the authenticated server API", async () => {
  const alpacaOrder = { id: "alpaca-order-1", side: "buy" };
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => alpacaOrder,
  });

  await expect(
    submitOrder({
      side: "buy",
      type: "limit",
      quantity: 2,
      limitPrice: 228.2,
    }),
  ).resolves.toEqual(alpacaOrder);

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/orders",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        side: "buy",
        type: "limit",
        quantity: 2,
        limitPrice: 228.2,
      }),
    }),
  );
});

test("submits market sell orders without sending a limit price", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ id: "alpaca-order-2" }),
  });

  await submitOrder({ side: "sell", type: "market", quantity: 1 });

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/orders",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ side: "sell", type: "market", quantity: 1 }),
    }),
  );
});

test("cancels an order through the authenticated server API", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 });

  await expect(cancelOrder("order/123")).resolves.toBeNull();

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/orders/order%2F123",
    expect.objectContaining({ method: "DELETE", credentials: "include" }),
  );
});

test("loads historical stock bars through the authenticated server API", async () => {
  const bars = [{ t: "2026-09-27T15:00:00Z", c: 229.45, v: 1200 }];
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ bars }),
  });

  await expect(getStockBars("AAPL")).resolves.toEqual({ bars });
  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/market-data/AAPL/bars",
    expect.objectContaining({ credentials: "include" }),
  );
});