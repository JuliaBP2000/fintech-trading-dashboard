import { Router } from 'express';
import {
  cancelPaperOrder,
  getStockBars,
  getPaperAccount,
  listPaperOrders,
  submitPaperOrder,
} from './alpaca.mjs';

const router = Router();

router.get('/market-data/:symbol/bars', async (request, response) => {
  try {
    response.json(await getStockBars(request.params.symbol));
  } catch (error) {
    sendError(response, error);
  }
});

function sendError(response, error) {
  console.error('Erro na API de Paper Trading:', error.message);
  response.status(400).json({ message: error.message });
}

router.get('/account', async (_request, response) => {
  try {
    response.json(await getPaperAccount());
  } catch (error) {
    sendError(response, error);
  }
});

router.get('/orders', async (request, response) => {
  try {
    response.json(await listPaperOrders(request.query.status || 'open'));
  } catch (error) {
    sendError(response, error);
  }
});

router.post('/orders', async (request, response) => {
  try {
    const order = await submitPaperOrder(request.body);
    response.status(201).json(order);
  } catch (error) {
    sendError(response, error);
  }
});

router.delete('/orders/:orderId', async (request, response) => {
  try {
    await cancelPaperOrder(request.params.orderId);
    response.status(204).end();
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
