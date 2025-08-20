import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../lib/database';
import crypto from 'crypto';

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

// In-memory stores (trocar por persistência real depois)
const emailVerificationTokens = new Map<string,string>(); // token -> userId
const passwordResetTokens = new Map<string,{userId:string,expires:number}>();

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

// Request email verification
export const requestEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (user.emailVerified) { res.json({ message: 'Already verified' }); return; }
    const token = crypto.randomBytes(24).toString('hex');
    emailVerificationTokens.set(token, userId);
    // Placeholder envio email
    console.log('[EMAIL_VERIFY_LINK]', `/verify-email?token=${token}`);
    res.json({ message: 'Verification email sent (mock)', token });
  } catch (e) {
    console.error('requestEmailVerification error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') { res.status(400).json({ error: 'Invalid token' }); return; }
    const userId = emailVerificationTokens.get(token);
    if (!userId) { res.status(400).json({ error: 'Token not found or expired' }); return; }
    await db.user.update({ where: { id: userId }, data: { emailVerified: true } });
    emailVerificationTokens.delete(token);
    res.json({ message: 'Email verified' });
  } catch (e) {
    console.error('verifyEmail error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email required' }); return; }
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      passwordResetTokens.set(token, { userId: user.id, expires: Date.now() + 1000*60*30 });
      console.log('[PASSWORD_RESET_LINK]', `/reset-password?token=${token}`);
    }
    res.json({ message: 'If the email exists, a reset link was sent (mock)' });
  } catch (e) {
    console.error('requestPasswordReset error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) { res.status(400).json({ error: 'Token and password required' }); return; }
    const entry = passwordResetTokens.get(token);
    if (!entry || entry.expires < Date.now()) { res.status(400).json({ error: 'Invalid or expired token' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({ where: { id: entry.userId }, data: { passwordHash } });
    passwordResetTokens.delete(token);
    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error('resetPassword error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
