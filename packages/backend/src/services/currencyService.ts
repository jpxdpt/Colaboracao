import { Currency } from '../models';

/**
 * Serviço de Moeda Virtual - Economia interna do sistema
 */

interface TransactionParams {
  userId: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Adiciona ou remove moeda do utilizador
 */
export const addTransaction = async (params: TransactionParams): Promise<{
  currency: typeof Currency;
  newBalance: number;
}> => {
  const { userId, type, amount, source, description, metadata } = params;

  // Buscar ou criar currency do utilizador
  let currency = await Currency.findOne({ user: userId });

  if (!currency) {
    currency = new Currency({
      user: userId,
      balance: 0,
      transactions: [],
    });
  }

  // Calcular novo saldo
  const newBalance =
    type === 'earn'
      ? currency.balance + amount
      : Math.max(0, currency.balance - amount); // Não permitir saldo negativo

  // Adicionar transação
  currency.transactions.push({
    type,
    amount,
    source,
    description,
    timestamp: new Date(),
    metadata,
  });

  // Atualizar saldo
  currency.balance = newBalance;

  // Manter apenas últimas 1000 transações (para performance)
  if (currency.transactions.length > 1000) {
    currency.transactions = currency.transactions.slice(-1000);
  }

  await currency.save();

  return { currency, newBalance };
};

/**
 * Busca saldo atual do utilizador
 */
export const getBalance = async (userId: string): Promise<number> => {
  const currency = await Currency.findOne({ user: userId });
  return currency?.balance || 0;
};

/**
 * Busca histórico de transações
 */
export const getTransactionHistory = async (
  userId: string,
  limit = 50
): Promise<typeof Currency | null> => {
  const currency = await Currency.findOne({ user: userId });
  if (!currency) {
    return null;
  }

  // Retornar apenas últimas N transações
  const recentTransactions = currency.transactions
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);

  return {
    ...currency.toObject(),
    transactions: recentTransactions,
  } as typeof Currency;
};

/**
 * Converte pontos em moeda (taxa configurável)
 */
export const convertPointsToCurrency = async (
  userId: string,
  points: number,
  rate: number = 10 // 10 pontos = 1 moeda por padrão
): Promise<{
  currency: typeof Currency;
  currencyEarned: number;
}> => {
  const currencyEarned = Math.floor(points / rate);

  if (currencyEarned <= 0) {
    throw new Error('Pontos insuficientes para conversão');
  }

  const result = await addTransaction({
    userId,
    type: 'earn',
    amount: currencyEarned,
    source: 'points_conversion',
    description: `Conversão de ${points} pontos`,
    metadata: { points, rate },
  });

  return {
    currency: result.currency,
    currencyEarned,
  };
};

/**
 * Verifica se utilizador tem saldo suficiente
 */
export const hasSufficientBalance = async (
  userId: string,
  amount: number
): Promise<boolean> => {
  const balance = await getBalance(userId);
  return balance >= amount;
};

