import { Router } from 'express';
import { CategoryService } from '../services/category.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';

const router = Router();
const categoryService = new CategoryService();

// GET /categories
router.get('/',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const categories = await categoryService.getCategories(req.userId!);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /categories/:id
router.get('/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const category = await categoryService.getCategoryById(req.userId!, req.params.id);
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /categories
router.post('/',
  authenticateToken,
  validateBody(schemas.createCategory),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const category = await categoryService.createCategory(req.userId!, req.body);
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /categories/:id
router.put('/:id',
  authenticateToken,
  validateParams(schemas.id),
  validateBody(schemas.updateCategory),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const category = await categoryService.updateCategory(req.userId!, req.params.id, req.body);
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /categories/:id
router.delete('/:id',
  authenticateToken,
  validateParams(schemas.id),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await categoryService.deleteCategory(req.userId!, req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /categories/reorder
router.post('/reorder',
  authenticateToken,
  validateBody(z.object({
    categoryIds: z.array(z.string().cuid())
  })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await categoryService.reorderCategories(req.userId!, req.body.categoryIds);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /categories/:id/budgets
router.get('/:id/budgets',
  authenticateToken,
  validateParams(schemas.id),
  validateQuery(schemas.budgetQuery),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const category = await categoryService.getCategoryWithBudgets(
        req.userId!,
        req.params.id,
        parseInt(req.query.year as string),
        parseInt(req.query.month as string)
      );
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /categories/usage
router.get('/usage',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const categories = await categoryService.getCategoryUsage(req.userId!);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;