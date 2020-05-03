import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total?: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const initialBalance = {
      income: 0,
      outcome: 0,
    };

    const findedTransactions = await this.find();

    const balance = findedTransactions.reduce(
      this.reduceBalance,
      initialBalance,
    );

    return {
      ...balance,
      total: balance.income - balance.outcome,
    };
  }

  public async findCategoryId(categoryTitle: string): Promise<string> {
    const categoryRepository = getRepository(Category);

    const findedCategory = await categoryRepository.findOne({
      title: categoryTitle,
    });

    if (findedCategory) {
      return findedCategory.id;
    }

    const actualDate = Date.now();
    const categoryInstance = categoryRepository.create({
      title: categoryTitle,
      updated_at: actualDate,
      created_at: actualDate,
    });

    const { id } = await categoryRepository.save(categoryInstance);

    return id;
  }

  private reduceBalance(
    { income, outcome }: Balance,
    { value, type }: Transaction,
  ): Balance {
    const isIncome = type === 'income';
    return {
      income: isIncome ? income + value : income,
      outcome: !isIncome ? outcome + value : outcome,
    };
  }
}

export default TransactionsRepository;
