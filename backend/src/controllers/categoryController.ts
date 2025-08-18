import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../lib/database';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().max(100, 'Icon name too long').optional(),
});

const updateCategorySchema = createCategorySchema.partial();

// Get all categories
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.category.findMany({
      orderBy: [
        { isDefault: 'desc' }, // Default categories first
        { name: 'asc' }
      ]
    });

    res.json({
      categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get categories'
    });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { budgets: true }
        }
      }
    });

    if (!category) {
      res.status(404).json({
        error: 'Category not found',
        message: 'Category with this ID does not exist'
      });
      return;
    }

    res.json({ category });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get category'
    });
  }
};

// Create new category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    // Check if category name already exists
    const existingCategory = await db.category.findFirst({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      res.status(400).json({
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
      return;
    }

    const category = await db.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        color: validatedData.color || null,
        icon: validatedData.icon || null
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create category'
    });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      res.status(404).json({
        error: 'Category not found',
        message: 'Category with this ID does not exist'
      });
      return;
    }

    // Check if updating name and name already exists
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await db.category.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: id }
        }
      });

      if (nameExists) {
        res.status(400).json({
          error: 'Category name already exists',
          message: 'A category with this name already exists'
        });
        return;
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.color !== undefined && { color: validatedData.color }),
        ...(validatedData.icon !== undefined && { icon: validatedData.icon })
      }
    });

    res.json({
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Update category error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update category'
    });
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { budgets: true }
        }
      }
    });

    if (!existingCategory) {
      res.status(404).json({
        error: 'Category not found',
        message: 'Category with this ID does not exist'
      });
      return;
    }

    // Prevent deletion of default categories
    if (existingCategory.isDefault) {
      res.status(400).json({
        error: 'Cannot delete default category',
        message: 'Default categories cannot be deleted'
      });
      return;
    }

    // Check if category has budgets
    if (existingCategory._count.budgets > 0) {
      res.status(400).json({
        error: 'Category in use',
        message: 'Cannot delete category that has associated budgets'
      });
      return;
    }

    await db.category.delete({
      where: { id }
    });

    res.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete category'
    });
  }
};

// Initialize default categories
export const initializeDefaultCategories = async () => {
  const defaultCategories = [
    { name: 'Food & Dining', description: 'Restaurants, groceries, and food expenses', color: '#FF6B6B', icon: 'restaurant' },
    { name: 'Transportation', description: 'Flights, trains, buses, and local transport', color: '#4ECDC4', icon: 'directions_car' },
    { name: 'Accommodation', description: 'Hotels, hostels, and lodging', color: '#45B7D1', icon: 'hotel' },
    { name: 'Entertainment', description: 'Activities, tours, and entertainment', color: '#FFA726', icon: 'movie' },
    { name: 'Shopping', description: 'Souvenirs, clothes, and personal items', color: '#AB47BC', icon: 'shopping_bag' },
    { name: 'Health & Medical', description: 'Medical expenses and health-related costs', color: '#EF5350', icon: 'local_hospital' },
    { name: 'Communication', description: 'Internet, phone, and communication costs', color: '#26A69A', icon: 'phone' },
    { name: 'Travel Insurance', description: 'Insurance and safety-related expenses', color: '#66BB6A', icon: 'security' },
    { name: 'Miscellaneous', description: 'Other travel-related expenses', color: '#78909C', icon: 'category' }
  ];

  try {
    for (const category of defaultCategories) {
      // Check if category exists first
      const existingCategory = await db.category.findFirst({
        where: { name: category.name }
      });

      if (!existingCategory) {
        await db.category.create({
          data: {
            ...category,
            isDefault: true
          }
        });
      }
    }
    console.log('✅ Default categories initialized');
  } catch (error) {
    console.error('❌ Failed to initialize default categories:', error);
  }
};
