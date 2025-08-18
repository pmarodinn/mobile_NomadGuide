import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../lib/database';

// Validation schemas
const createBudgetSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Amount must be positive'),
  plannedAmount: z.number().positive('Planned amount must be positive').optional(),
  actualAmount: z.number().positive('Actual amount must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  description: z.string().optional(),
  location: z.string().max(255, 'Location too long').optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).optional(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  transactionDate: z.string().datetime().optional()
});

const updateBudgetSchema = createBudgetSchema.partial();

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxAmount: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  currency: z.string().length(3).optional(),
  tags: z.string().optional(), // Comma-separated tags
});

// Get user budgets with filtering
export const getBudgets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const query = querySchema.parse(req.query);
    
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Build where clause
    let where: any = {
      userId,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.currency && { currency: query.currency }),
    };

    if (query.minAmount) {
      where.amount = { gte: query.minAmount };
    }
    if (query.maxAmount) {
      where.amount = { ...where.amount, lte: query.maxAmount };
    }
    if (query.startDate) {
      where.transactionDate = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.transactionDate = { 
        ...where.transactionDate, 
        lte: new Date(query.endDate) 
      };
    }
    if (query.tags) {
      where.tags = { 
        hasSome: query.tags.split(',').map(tag => tag.trim()) 
      };
    }

    const [budgets, total] = await Promise.all([
      db.budget.findMany({
        where,
        include: {
          category: true
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit
      }),
      db.budget.count({ where })
    ]);

    // Calculate totals
    const totals = await db.budget.aggregate({
      where,
      _sum: { amount: true },
      _count: true
    });

    res.json({
      budgets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: totals._sum.amount || 0,
        totalTransactions: totals._count
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Get budgets error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get budgets'
    });
  }
};

// Get budget by ID
export const getBudgetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const budget = await db.budget.findFirst({
      where: { 
        id,
        userId // Ensure user can only access their own budgets
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!budget) {
      res.status(404).json({
        error: 'Budget not found',
        message: 'Budget with this ID does not exist or access denied'
      });
      return;
    }

    res.json({ budget });

  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get budget'
    });
  }
};

// Create new budget
export const createBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const validatedData = createBudgetSchema.parse(req.body);

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id: validatedData.categoryId }
    });

    if (!category) {
      res.status(400).json({
        error: 'Invalid category',
        message: 'Category does not exist'
      });
      return;
    }

    const budgetData: any = {
      userId,
      categoryId: validatedData.categoryId,
      amount: validatedData.amount,
      currency: validatedData.currency || 'USD',
      transactionDate: validatedData.transactionDate 
        ? new Date(validatedData.transactionDate)
        : new Date()
    };

    if (validatedData.plannedAmount) budgetData.plannedAmount = validatedData.plannedAmount;
    if (validatedData.actualAmount) budgetData.actualAmount = validatedData.actualAmount;
    if (validatedData.description) budgetData.description = validatedData.description;
    if (validatedData.location) budgetData.location = validatedData.location;
    if (validatedData.coordinates) budgetData.coordinates = validatedData.coordinates;
    if (validatedData.receiptUrl) budgetData.receiptUrl = validatedData.receiptUrl;
    if (validatedData.tags) budgetData.tags = validatedData.tags;
    if (validatedData.isRecurring !== undefined) budgetData.isRecurring = validatedData.isRecurring;
    if (validatedData.recurringPeriod) budgetData.recurringPeriod = validatedData.recurringPeriod;

    const budget = await db.budget.create({
      data: budgetData,
      include: {
        category: true
      }
    });

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Create budget error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create budget'
    });
  }
};

// Update budget
export const updateBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const validatedData = updateBudgetSchema.parse(req.body);

    // Check if budget exists and belongs to user
    const existingBudget = await db.budget.findFirst({
      where: { id, userId }
    });

    if (!existingBudget) {
      res.status(404).json({
        error: 'Budget not found',
        message: 'Budget with this ID does not exist or access denied'
      });
      return;
    }

    // Verify category exists if updating category
    if (validatedData.categoryId) {
      const category = await db.category.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        res.status(400).json({
          error: 'Invalid category',
          message: 'Category does not exist'
        });
        return;
      }
    }

    const budget = await db.budget.update({
      where: { id },
      data: {
        ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.plannedAmount !== undefined && { plannedAmount: validatedData.plannedAmount }),
        ...(validatedData.actualAmount !== undefined && { actualAmount: validatedData.actualAmount }),
        ...(validatedData.currency && { currency: validatedData.currency }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.location !== undefined && { location: validatedData.location }),
        ...(validatedData.coordinates !== undefined && { coordinates: validatedData.coordinates }),
        ...(validatedData.receiptUrl !== undefined && { receiptUrl: validatedData.receiptUrl }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(validatedData.isRecurring !== undefined && { isRecurring: validatedData.isRecurring }),
        ...(validatedData.recurringPeriod !== undefined && { recurringPeriod: validatedData.recurringPeriod }),
        ...(validatedData.transactionDate && {
          transactionDate: new Date(validatedData.transactionDate)
        })
      },
      include: {
        category: true
      }
    });

    res.json({
      message: 'Budget updated successfully',
      budget
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Update budget error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update budget'
    });
  }
};

// Delete budget
export const deleteBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if budget exists and belongs to user
    const existingBudget = await db.budget.findFirst({
      where: { id, userId }
    });

    if (!existingBudget) {
      res.status(404).json({
        error: 'Budget not found',
        message: 'Budget with this ID does not exist or access denied'
      });
      return;
    }

    await db.budget.delete({
      where: { id }
    });

    res.json({
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete budget'
    });
  }
};

// Get budget statistics
export const getBudgetStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { period = 'month', startDate, endDate } = req.query;

    // Build where clause for date filtering
    const whereClause: any = { userId };

    if (startDate && endDate) {
      whereClause.transactionDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else {
      // Default period filtering
      const now = new Date();
      if (period === 'week') {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        whereClause.transactionDate = { gte: weekStart };
      } else if (period === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.transactionDate = { gte: monthStart };
      } else if (period === 'year') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        whereClause.transactionDate = { gte: yearStart };
      }
    }

    // Get total statistics
    const totalStats = await db.budget.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
        plannedAmount: true,
        actualAmount: true
      },
      _count: {
        _all: true
      }
    });

    // Get category breakdown
    const categoryStats = await db.budget.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _sum: {
        amount: true,
        plannedAmount: true,
        actualAmount: true
      },
      _count: {
        _all: true
      }
    });

    // Enrich category data
    const enrichedCategoryStats = await Promise.all(
      categoryStats.map(async (stat: any) => {
        const category = await db.category.findUnique({
          where: { id: stat.categoryId }
        });
        
        return {
          category: category?.name || 'Unknown',
          categoryId: stat.categoryId,
          totalAmount: Number(stat._sum.amount) || 0,
          totalPlanned: Number(stat._sum.plannedAmount) || 0,
          totalActual: Number(stat._sum.actualAmount) || 0,
          totalTransactions: stat._count._all,
          difference: Number(stat._sum.actualAmount || 0) - Number(stat._sum.plannedAmount || 0)
        };
      })
    );

    res.json({
      period,
      startDate,
      endDate,
      totalStatistics: {
        totalAmount: Number(totalStats._sum.amount) || 0,
        totalPlanned: Number(totalStats._sum.plannedAmount) || 0,
        totalActual: Number(totalStats._sum.actualAmount) || 0,
        totalTransactions: totalStats._count._all,
        difference: Number(totalStats._sum.actualAmount || 0) - Number(totalStats._sum.plannedAmount || 0)
      },
      categoryBreakdown: enrichedCategoryStats
    });

  } catch (error) {
    console.error('Get budget statistics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get budget statistics'
    });
  }
};
