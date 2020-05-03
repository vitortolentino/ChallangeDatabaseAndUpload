import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const transactionsRepository = new TransactionsRepository();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepo = getCustomRepository(TransactionsRepository);
  const balance = await transactionsRepo.getBalance();

  const transactions = await transactionsRepo.find();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { type, category, value, title } = request.body;

  const createTransactionService = new CreateTransactionService(
    transactionsRepository,
  );

  const transaction = await createTransactionService.execute({
    type,
    title,
    value,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  // TODO
});

transactionsRouter.post('/import', async (request, response) => {
  // TODO
});

export default transactionsRouter;
