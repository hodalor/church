import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Tenant from '../tenants/model.js';
import Expense from './models/expense.model.js';
import Transaction from './models/transaction.model.js';

const uploadBufferToSupabase = jest.fn(async () => 'https://example.com/receipts/test.pdf');

jest.unstable_mockModule('../../utils/supabaseStorage.js', () => ({
  uploadBufferToSupabase,
  default: {},
}));

jest.unstable_mockModule('../../utils/auditLogger.js', () => ({
  logAudit: jest.fn(),
  default: jest.fn(),
}));

const { getTransactionSummary, recordTransaction } = await import('./finance.service.js');
const transactions = [];

const matchesFilters = (transaction, filters = {}) => {
  if (filters.tenantId && transaction.tenantId !== filters.tenantId) {
    return false;
  }

  if (typeof filters.isReversed === 'boolean' && transaction.isReversed !== filters.isReversed) {
    return false;
  }

  if (filters.branch) {
    if (typeof filters.branch === 'string' && transaction.branch !== filters.branch) {
      return false;
    }

    if (filters.branch?.$in && !filters.branch.$in.includes(transaction.branch)) {
      return false;
    }
  }

  if (filters.serviceDate) {
    const serviceDate = new Date(transaction.serviceDate);

    if (filters.serviceDate.$gte && serviceDate < filters.serviceDate.$gte) {
      return false;
    }

    if (filters.serviceDate.$lt && serviceDate >= filters.serviceDate.$lt) {
      return false;
    }
  }

  return true;
};

describe('Finance Service - recordTransaction', () => {
  beforeEach(async () => {
    transactions.length = 0;
    jest.restoreAllMocks();

    jest.spyOn(Transaction, 'create').mockImplementation(async (payload) => {
      const year = new Date(payload.serviceDate || Date.now()).getFullYear();
      const index = transactions.length + 1;
      const transaction = {
        _id: new mongoose.Types.ObjectId(),
        ...payload,
        transactionId: `TXN-${payload.tenantId.toUpperCase()}-${Date.now()}-${String(index).padStart(4, '0')}`,
        receiptNumber: `RCP-${payload.tenantId.toUpperCase()}-${year}-${String(index).padStart(5, '0')}`,
        receiptUrl: payload.receiptUrl || '',
        isReversed: payload.isReversed || false,
        async save() {
          return this;
        },
        toObject() {
          return {
            ...this,
          };
        },
      };

      transactions.push(transaction);
      return transaction;
    });

    jest.spyOn(Transaction, 'find').mockImplementation(async (filters = {}) =>
      transactions.filter((transaction) => matchesFilters(transaction, filters)),
    );

    jest.spyOn(Expense, 'find').mockResolvedValue([]);
    jest.spyOn(Expense, 'countDocuments').mockResolvedValue(0);

    await Tenant.create({
      tenantId: 'testchurch',
      churchName: 'Test Church',
      email: 'test@church.com',
      isActive: true,
      isSuspended: false,
    });
  });

  it('creates a transaction with auto-generated transactionId', async () => {
    const tx = await recordTransaction(
      'testchurch',
      {
        type: 'tithe',
        amount: 500,
        serviceDate: new Date(),
        paymentMethod: 'cash',
      },
      { userId: 'user123', role: 'treasurer' },
    );

    expect(tx.transactionId).toMatch(/^TXN-/);
    expect(tx.receiptNumber).toMatch(/^RCP-/);
    expect(tx.amount).toBe(500);
    expect(tx.receiptUrl).toBe('https://example.com/receipts/test.pdf');
  });

  it('rejects negative amounts', async () => {
    await expect(
      recordTransaction(
        'testchurch',
        {
          type: 'tithe',
          amount: -100,
          serviceDate: new Date(),
          paymentMethod: 'cash',
        },
        { userId: 'user123', role: 'treasurer' },
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects zero amounts', async () => {
    await expect(
      recordTransaction(
        'testchurch',
        {
          type: 'offering',
          amount: 0,
          serviceDate: new Date(),
          paymentMethod: 'cash',
        },
        { userId: 'user123', role: 'treasurer' },
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('scopes transactions to tenant', async () => {
    await recordTransaction(
      'testchurch',
      {
        type: 'tithe',
        amount: 200,
        serviceDate: new Date(),
        paymentMethod: 'cash',
      },
      { userId: 'user1', role: 'treasurer' },
    );

    const summary = await getTransactionSummary('otherchurch', {});

    expect(summary.totalIncome).toBe(0);
  });
});
