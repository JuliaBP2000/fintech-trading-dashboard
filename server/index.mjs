import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import 'dotenv/config';
import authRouter, { requireAuth } from './api/auth.mjs';
import { initializeDatabase } from './api/database.mjs';
import ordersRouter from './api/orders.mjs';

await initializeDatabase();

const app = express();
app.use(express.json());
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }

  next();
});
app.use('/api/auth', authRouter);
app.use('/api', requireAuth, ordersRouter);

const server = app.listen(3001, () => {
  console.log('Servidor em http://localhost:3001');
});

const clients = new WebSocketServer({ server });

const alpaca = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');

alpaca.on('open', () => {
  console.log('Conectado ao WebSocket da Alpaca.');
});

alpaca.on('message', (raw) => {
  const events = JSON.parse(raw.toString());

  events.forEach((event) => {
    if (event.T === 'success' || event.T === 'subscription' || event.T === 'error') {
      console.log('Alpaca:', event);
    }

    if (event.T === 'success' && event.msg === 'connected') {
      console.log('Autenticando na Alpaca...');
      alpaca.send(JSON.stringify({
        action: 'auth',
        key: process.env.ALPACA_API_KEY,
        secret: process.env.ALPACA_API_SECRET,
      }));
    }

    if (event.T === 'success' && event.msg === 'authenticated') {
      console.log('Assinando dados de AAPL...');
      alpaca.send(JSON.stringify({
        action: 'subscribe',
        trades: ['AAPL'],
        quotes: ['AAPL'],
        bars: ['AAPL'],
      }));
    }

    for (const client of clients.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    }
  });
});

alpaca.on('error', (error) => {
  console.error('Erro na conexão com a Alpaca:', error.message);
});

alpaca.on('close', (code, reason) => {
  console.warn(`Conexão Alpaca encerrada (${code}): ${reason.toString() || 'sem motivo informado'}`);
});

