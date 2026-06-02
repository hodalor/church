import { body, query } from 'express-validator';
import { transactionTypes, paymentMethods } from './models/transaction.model.js';
import { expenseCategories, expensePaymentMethods } from './models/expense.model.js';
import { pledgeTypes } from './models/pledge.model.js';

const notFutureDateValidator = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Date must be valid.');
  }
  if (date.getTime() > Date.now()) {
    throw new Error('Date cannot be in the future.');
  }
  return true;
};

export const recordTransactionValidation = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),
  body('type')
    .isIn(transactionTypes)
    .withMessage('Transaction type is invalid.'),
  body('serviceDate')
    .notEmpty()
    .withMessage('Service date is required.')
    .bail()
    .custom(notFutureDateValidator),
  body('paymentMethod')
    .optional({ values: 'falsy' })
    .isIn(paymentMethods)
    .withMessage('Payment method is invalid.'),
  body('memberId').optional({ values: 'falsy' }).trim().isString(),
  body('currency').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 5 }),
  body('receiptUrl').optional({ values: 'falsy' }).isURL().withMessage('Receipt URL must be valid.'),
];

export const recordExpenseValidation = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),
  body('category')
    .isIn(expenseCategories)
    .withMessage('Expense category is invalid.'),
  body('description')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Description must be at least 3 characters long.'),
  body('expenseDate')
    .notEmpty()
    .withMessage('Expense date is required.')
    .bail()
    .isISO8601()
    .withMessage('Expense date must be valid.'),
  body('paymentMethod')
    .optional({ values: 'falsy' })
    .isIn(expensePaymentMethods)
    .withMessage('Payment method is invalid.'),
  body('receiptUrl').optional({ values: 'falsy' }).isURL().withMessage('Receipt URL must be valid.'),
];

export const createPledgeValidation = [
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  body('totalAmount')
    .isFloat({ gt: 0 })
    .withMessage('Total amount must be a positive number.'),
  body('pledgeType')
    .isIn(pledgeTypes)
    .withMessage('Pledge type is invalid.'),
  body('expectedEndDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Expected end date must be valid.')
    .bail()
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error('Expected end date must be in the future.');
      }
      return true;
    }),
];

export const budgetValidation = [
  body('year').isInt({ min: 2000 }).withMessage('Budget year is invalid.'),
  body('month').optional({ nullable: true }).isInt({ min: 1, max: 12 }),
  body('lines').isArray({ min: 1 }).withMessage('At least one budget line is required.'),
];

export const goalValidation = [
  body('year').isInt({ min: 2000 }).withMessage('Goal year is invalid.'),
  body('month').optional({ nullable: true }).isInt({ min: 1, max: 12 }),
  body('targetAmount')
    .isFloat({ gt: 0 })
    .withMessage('Target amount must be a positive number.'),
];

export const reportYearValidation = [
  query('year').optional().isInt({ min: 2000 }).withMessage('Year is invalid.'),
];
