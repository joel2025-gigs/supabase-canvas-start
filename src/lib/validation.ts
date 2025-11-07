import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  phone: z.string()
    .trim()
    .regex(/^\+256[0-9]{9}$/, 'Invalid Uganda phone number format (+256XXXXXXXXX)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
});

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  password: z.string()
    .min(1, 'Password is required')
});

export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  phone: z.string()
    .trim()
    .regex(/^\+256[0-9]{9}$/, 'Invalid Uganda phone number format (+256XXXXXXXXX)'),
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message too long')
});
