const PAPER_TRADING_URL = 'https://paper-api.alpaca.markets';
const MARKET_DATA_URL = 'https://data.alpaca.markets';

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

async function requestMarketData(path) {
  const response = await fetch(`${MARKET_DATA_URL}${path}`, {
    headers: getHeaders(),
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

export function getStockBars(symbol = 'AAPL', limit = 60) {
  const normalizedSymbol = String(symbol).toUpperCase();
  if (!/^[A-Z.]{1,10}$/.test(normalizedSymbol)) {
    throw new Error('Informe um símbolo de ação válido.');
  }

  const query = new URLSearchParams({
    timeframe: '1Min',
    limit: String(limit),
    feed: 'iex',
    sort: 'desc',
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });
  return requestMarketData(`/v2/stocks/${normalizedSymbol}/bars?${query}`).then((data) => ({
    ...data,
    bars: [...(data.bars || [])].reverse(),
  }));
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
