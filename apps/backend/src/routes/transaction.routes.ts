import { Router } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const transactionService = new TransactionService();

// GET /transactions
router.get('/',
  authenticateToken,
  validateQuery(schemas.transactionQuery),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        category: req.query.category as string,
        type: req.query.type as 'expense' | 'income',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };
      const result = await transactionService.getTransactions(req.userId!, params);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /transactions/:id
router.get('/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const transaction = await transactionService.getTransactionById(req.userId!, req.params.id);
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /transactions
router.post('/',
  authenticateToken,
  validateBody(schemas.createTransaction),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const transaction = await transactionService.createTransaction(req.userId!, req.body);
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /transactions/:id
router.put('/:id',
  authenticateToken,
  validateParams(schemas.id),
  validateBody(schemas.updateTransaction),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const transaction = await transactionService.updateTransaction(req.userId!, req.params.id, req.body);
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /transactions/:id
router.delete('/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await transactionService.deleteTransaction(req.userId!, req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /transactions/summary
router.get('/summary',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await transactionService.getTransactionSummary(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /transactions/category-summary
router.get('/category-summary',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await transactionService.getCategorySummary(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /transactions/uncategorized
router.get('/uncategorized',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const transactions = await transactionService.getUncategorizedTransactions(req.userId!);
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;