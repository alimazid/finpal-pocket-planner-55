import { prisma } from '../config/database.js';
import { 
  BudgetCategory, 
  CreateCategoryDto, 
  UpdateCategoryDto 
} from '../types/index.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';

export class CategoryService {

  async getCategories(userId: string) {
    const categories = await prisma.budgetCategory.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' }
    });

    return categories;
  }

  async getCategoryById(userId: string, categoryId: string) {
    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async createCategory(userId: string, data: CreateCategoryDto) {
    // Check if category name already exists for this user
    const existingCategory = await prisma.budgetCategory.findFirst({
      where: { 
        userId, 
        name: data.name 
      }
    });

    if (existingCategory) {
      throw new ValidationError('Category with this name already exists');
    }

    // Get the next sort order
    const lastCategory = await prisma.budgetCategory.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'desc' }
    });

    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1;

    const category = await prisma.budgetCategory.create({
      data: {
        userId,
        name: data.name,
        sortOrder: nextSortOrder
      }
    });

    return category;
  }

  async updateCategory(userId: string, categoryId: string, data: UpdateCategoryDto) {
    const existingCategory = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId }
    });

    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    // Check if new name conflicts with existing category
    if (data.name && data.name !== existingCategory.name) {
      const conflictingCategory = await prisma.budgetCategory.findFirst({
        where: { 
          userId, 
          name: data.name,
          id: { not: categoryId }
        }
      });

      if (conflictingCategory) {
        throw new ValidationError('Category with this name already exists');
      }
    }

    const category = await prisma.budgetCategory.update({
      where: { id: categoryId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      }
    });

    return category;
  }

  async deleteCategory(userId: string, categoryId: string) {
    const existingCategory = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId }
    });

    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    // Check if category is used in any budgets
    const budgetsCount = await prisma.budget.count({
      where: { categoryId }
    });

    if (budgetsCount > 0) {
      throw new ValidationError('Cannot delete category that is used in budgets');
    }

    await prisma.budgetCategory.delete({
      where: { id: categoryId }
    });

    return { success: true };
  }

  async reorderCategories(userId: string, categoryIds: string[]) {
    // Verify all categories belong to user
    const categories = await prisma.budgetCategory.findMany({
      where: { 
        userId,
        id: { in: categoryIds }
      }
    });

    if (categories.length !== categoryIds.length) {
      throw new ValidationError('Some categories not found or do not belong to user');
    }

    // Update sort order for each category
    const updatePromises = categoryIds.map((categoryId, index) =>
      prisma.budgetCategory.update({
        where: { id: categoryId },
        data: { sortOrder: index }
      })
    );

    await Promise.all(updatePromises);

    return { success: true };
  }

  async getCategoryWithBudgets(userId: string, categoryId: string, year: number, month: number) {
    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId },
      include: {
        budgets: {
          where: {
            targetYear: year,
            targetMonth: month
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return {
      ...category,
      budgets: category.budgets.map(budget => ({
        ...budget,
        amount: Number(budget.amount),
        spent: Number(budget.spent)
      }))
    };
  }

  async getCategoryUsage(userId: string) {
    const categories = await prisma.budgetCategory.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            budgets: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return categories.map(category => ({
      ...category,
      budgetCount: category._count.budgets
    }));
  }
}