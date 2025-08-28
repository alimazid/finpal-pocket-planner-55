import { Router } from 'express';
import { BudgetService } from '../services/budget.service.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
const budgetService = new BudgetService();

// GET /budgets?year=2024&month=3
router.get('/',
  authenticateToken,
  validateQuery(schemas.budgetQuery),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = {
        year: parseInt(req.query.year as string),
        month: parseInt(req.query.month as string)
      };
      const budgets = await budgetService.getBudgetsForPeriod(req.userId!, params);
      res.json({
        success: true,
        data: budgets
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /budgets/:id
router.get('/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const budget = await budgetService.getBudgetById(req.userId!, req.params.id);
      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /budgets
router.post('/',
  authenticateToken,
  validateBody(schemas.createBudget),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const budget = await budgetService.createBudget(req.userId!, req.body);
      res.status(201).json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /budgets/:id
router.put('/:id',
  authenticateToken,
  validateParams(schemas.id),
  validateBody(schemas.updateBudget),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const budget = await budgetService.updateBudget(req.userId!, req.params.id, req.body);
      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /budgets/:id
router.delete('/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await budgetService.deleteBudget(req.userId!, req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /budgets/create-missing
router.post('/create-missing',
  authenticateToken,
  validateBody(schemas.budgetQuery),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const budgets = await budgetService.createMissingBudgets(
        req.userId!,
        req.body.year,
        req.body.month
      );
      res.status(201).json({
        success: true,
        data: budgets
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /budgets/recalculate-spent
router.post('/recalculate-spent',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await budgetService.recalculateAllSpentAmounts(req.userId!);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;