import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import uploader from '../config/upload';

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
  const { id } = request.params;

  const deleteService = new DeleteTransactionService();

  await deleteService.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  uploader.single('file'),
  async (request, response) => {
    const {
      file: { path },
    } = request;

    const importTransactionsService = new ImportTransactionsService();

    const transactions = await importTransactionsService.execute(path);

    return response.json(transactions);
  },
);

export default transactionsRouter;
