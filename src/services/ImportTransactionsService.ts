import { getCustomRepository, getRepository, In, Repository } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const categories: string[] = [];
    const transactions: CSVTransaction[] = [];

    await this.readCSVThenResolveTransactionsAndCategories(
      filePath,
      categories,
      transactions,
    );

    const [
      existentCategories,
      insertedCategories,
    ] = await this.createCategories(categories, categoriesRepository);

    const allCategories = [...insertedCategories, ...existentCategories];

    const createdTransactions = await this.createTransactions(
      transactions,
      allCategories,
      transactionRepository,
    );

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }

  private async readCSVThenResolveTransactionsAndCategories(
    filePath: string,
    categories: string[],
    transactions: CSVTransaction[],
  ): Promise<void> {
    const transactionsStream = fs.createReadStream(filePath);

    const parsers = csvParse({ from_line: 2 });

    const parseCSV = transactionsStream.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));
  }

  private async createCategories(
    categories: string[],
    categoriesRepository: Repository<Category>,
  ): Promise<Array<Category[]>> {
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
      select: ['title'],
    });

    const existentCategoriesTitles = existentCategories.map(
      ({ title }: Category) => title,
    );

    const categoriesTitleToInsert = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((category, index, self) => self.indexOf(category) === index);

    const insertedCategories = categoriesRepository.create(
      categoriesTitleToInsert.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(insertedCategories);

    return [existentCategories, insertedCategories];
  }

  private async createTransactions(
    transactions: CSVTransaction[],
    allCategories: Category[],
    transactionRepository: Repository<Transaction>,
  ): Promise<Transaction[]> {
    const createdTransactions = transactionRepository.create(
      transactions.map(({ title, value, type, category }) => ({
        title,
        type,
        value,
        category: allCategories.find(
          actualCategory => actualCategory.title === category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
