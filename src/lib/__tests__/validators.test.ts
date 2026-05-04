import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validators'

describe('loginSchema', () => {
  it('should validate a valid login input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('should validate a valid registration input', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    })
    expect(result.success).toBe(true)
  })

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'password1!',
      confirmPassword: 'password1!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'Passwordabc!',
      confirmPassword: 'Passwordabc!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without special character', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'Password1!',
      confirmPassword: 'Different1!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'user@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'Pw1!',
      confirmPassword: 'Pw1!',
    })
    expect(result.success).toBe(false)
  })
})

describe('createWorkspaceSchema', () => {
  it('should validate with defaults', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'my-workspace',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.platform).toBe('general')
      expect(result.data.cpu).toBe('1')
      expect(result.data.ram).toBe('1024')
      expect(result.data.disk).toBe('10')
    }
  })

  it('should reject name shorter than 3 characters', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'ab',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty name', () => {
    const result = createWorkspaceSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateWorkspaceSchema', () => {
  it('should validate partial updates', () => {
    const result = updateWorkspaceSchema.safeParse({
      name: 'new-name',
    })
    expect(result.success).toBe(true)
  })

  it('should validate status update', () => {
    const result = updateWorkspaceSchema.safeParse({
      status: 'stopped',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const result = updateWorkspaceSchema.safeParse({
      status: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('should accept empty object', () => {
    const result = updateWorkspaceSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('forgotPasswordSchema', () => {
  it('should validate valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'bad-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('should validate valid reset', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'reset-token-123',
      password: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    })
    expect(result.success).toBe(true)
  })

  it('should reject mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'reset-token-123',
      password: 'NewPassword1!',
      confirmPassword: 'Different1!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      password: 'NewPassword1!',
      confirmPassword: 'NewPassword1!',
    })
    expect(result.success).toBe(false)
  })
})
