import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),
  platform: z
    .string()
    .optional()
    .default('general'),
  cpu: z
    .string()
    .optional()
    .default('1'),
  ram: z
    .string()
    .optional()
    .default('1024'),
  disk: z
    .string()
    .optional()
    .default('10'),
})

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  platform: z.string().optional(),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  disk: z.string().optional(),
  status: z.enum(['running', 'stopped', 'creating', 'error']).optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
