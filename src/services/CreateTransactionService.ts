import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Input {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}

class CreateTransactionService {
  transactionRepository: TransactionsRepository;

  constructor(transactionRepository: TransactionsRepository) {
    this.transactionRepository = transactionRepository;
  }

  public async execute(data: Input): Promise<Transaction> {
    const { type, category, value, title } = data;

    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { income } = await transactionRepository.getBalance();
    const isOutcomeGreaterThanIncome = type === 'outcome' && value > income;
    if (isOutcomeGreaterThanIncome) {
      throw new AppError(
        'The outcome value cannot be greater than the income value',
        400,
      );
    }

    const categoryId = await this.transactionRepository.findCategoryId(
      category,
    );

    const transactionInstance = transactionRepository.create({
      type,
      value,
      title,
      category_id: categoryId,
    });

    return transactionRepository.save(transactionInstance);
  }
}

export default CreateTransactionService;
