import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../lib/database';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    
    // Create user with profile in transaction
    const result = await db.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
        }
      });
      
      // Create user profile if name data provided
      if (validatedData.firstName || validatedData.lastName) {
        await tx.userProfile.create({
          data: {
            userId: user.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
          }
        });
      }
      
      return user;
    });
    
    // Generate token
    const token = generateToken(result.id);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: result,
      token
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      }
    });
    
    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }
    
    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
      return;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }
    
    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }
    
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId; // From auth middleware
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            nationality: true,
            bio: true,
            profilePicture: true,
            phoneNumber: true,
            occupation: true,
            emergencyContact: true,
            preferences: true
          }
        }
      }
    });
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
      return;
    }
    
    res.json({
      user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user profile'
    });
  }
};
