const PAPER_TRADING_URL = 'https://paper-api.alpaca.markets';

function getHeaders() {
  const apiKey = process.env.ALPACA_API_KEY;
  const apiSecret = process.env.ALPACA_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('As credenciais de Paper Trading da Alpaca não foram configuradas.');
  }

  return {
    'APCA-API-KEY-ID': apiKey,
    'APCA-API-SECRET-KEY': apiSecret,
    'Content-Type': 'application/json',
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${PAPER_TRADING_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `A Alpaca recusou a solicitação (${response.status}).`);
  }

  return data;
}

export function getPaperAccount() {
  return request('/v2/account');
}

export function listPaperOrders(status = 'open') {
  return request(`/v2/orders?status=${encodeURIComponent(status)}&direction=desc`);
}

export function submitPaperOrder({ side, type, quantity, limitPrice }) {
  const normalizedSide = String(side).toLowerCase();
  const normalizedType = String(type).toLowerCase();
  const normalizedQuantity = Number(quantity);
  const normalizedLimitPrice = Number(limitPrice);

  if (!['buy', 'sell'].includes(normalizedSide)) {
    throw new Error('O lado da ordem deve ser compra ou venda.');
  }

  if (!['market', 'limit'].includes(normalizedType)) {
    throw new Error('O tipo da ordem deve ser mercado ou limite.');
  }

  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
    throw new Error('A quantidade deve ser um número inteiro maior que zero.');
  }

  if (normalizedType === 'limit' && (!Number.isFinite(normalizedLimitPrice) || normalizedLimitPrice <= 0)) {
    throw new Error('Informe um preço-limite válido.');
  }

  const order = {
    symbol: 'AAPL',
    qty: String(normalizedQuantity),
    side: normalizedSide,
    type: normalizedType,
    time_in_force: 'day',
  };

  if (normalizedType === 'limit') {
    order.limit_price = String(normalizedLimitPrice);
  }

  return request('/v2/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export function cancelPaperOrder(orderId) {
  return request(`/v2/orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
  });
}
