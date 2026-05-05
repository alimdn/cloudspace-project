import { z } from 'zod'

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // Optional but recommended
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),

  // Stripe (optional - warnings logged)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional(),
  STRIPE_CANCEL_URL: z.string().optional(),
  STRIPE_PRICE_BASIC: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_BUSINESS: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),

  // Redis (optional - falls back to in-memory)
  REDIS_URL: z.string().optional(),

  // Docker
  DOCKER_HOST: z.string().optional(),

  // SMTP (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

let _env: EnvConfig | null = null

export function validateEnv(): EnvConfig {
  if (_env) return _env

  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
    STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL,
    STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
    STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
    REDIS_URL: process.env.REDIS_URL,
    DOCKER_HOST: process.env.DOCKER_HOST,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_SECURE: process.env.SMTP_SECURE,
  })

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        // Only report issues for required fields (not optional ones)
        const path = issue.path.join('.')
        if (
          path === 'DATABASE_URL' ||
          path === 'JWT_SECRET'
        ) {
          return `[REQUIRED] ${path}: ${issue.message}`
        }
        return null
      })
      .filter(Boolean)
      .join('; ')

    if (errors) {
      throw new Error(`Missing required environment variables: ${errors}`)
    }
  }

  // Log warnings for missing optional vars
  const optionalChecks: [string, string][] = [
    ['STRIPE_SECRET_KEY', 'Stripe billing features will be unavailable'],
    ['STRIPE_WEBHOOK_SECRET', 'Stripe webhooks will not work'],
    ['REDIS_URL', 'Using in-memory caching (Redis not connected)'],
    ['SMTP_HOST', 'Email features will be unavailable'],
    ['DOCKER_HOST', 'Docker workspace features will not work'],
  ]

  if (process.env.NODE_ENV !== 'test') {
    for (const [key, warning] of optionalChecks) {
      if (!process.env[key]) {
        console.warn(`[Env] ${key} is not set. ${warning}.`)
      }
    }
  }

  _env = result.data as EnvConfig
  return _env
}

export function getEnv(): EnvConfig {
  if (!_env) {
    return validateEnv()
  }
  return _env
}
