const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const

type LogLevel = keyof typeof LOG_LEVELS

const isProduction = process.env.NODE_ENV === 'production'
const minLevel: LogLevel = isProduction ? 'warn' : 'debug'
const minLevelValue = LOG_LEVELS[minLevel]

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= minLevelValue
}

function timestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const ts = timestamp()
  const prefix = `[${ts}] [${level.toUpperCase()}]`
  return args.length > 0
    ? `${prefix} ${message} ${args.map(String).join(' ')}`
    : `${prefix} ${message}`
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, ...args))
    }
  },

  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, ...args))
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, ...args))
    }
  },

  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, ...args))
    }
  },
}
