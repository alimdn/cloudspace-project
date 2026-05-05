import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'error' },
        ],
  })
}

/**
 * Test database connectivity with retry logic.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
 */
async function connectWithRetry(client: PrismaClient): Promise<void> {
  const maxRetries = 3
  const baseDelay = 1000 // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.$connect()
      logger.info('Database connected successfully')
      return
    } catch (error) {
      const delay = baseDelay * Math.pow(2, attempt - 1)

      if (attempt === maxRetries) {
        logger.error(`Database connection failed after ${maxRetries} attempts`)
        throw error
      }

      logger.warn(
        `Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : String(error)
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

// Create the client (lazy connection - connect on first query)
const prismaClient = createPrismaClient()

export const db =
  globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Log events (type assertion needed due to Prisma's event log typing)
db.$on('warn' as never, (e: { message: string }) => {
  logger.warn(`[Prisma] ${e.message}`)
})

db.$on('error' as never, (e: { message: string }) => {
  logger.error(`[Prisma] ${e.message}`)
})

// Connection info for debugging
export const dbInfo = {
  url: process.env.DATABASE_URL?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') || 'Not configured',
  env: process.env.NODE_ENV || 'development',
}
