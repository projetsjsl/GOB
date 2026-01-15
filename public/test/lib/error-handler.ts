/**
 * Gestionnaire d'erreurs centralise pour CurveWatch
 */

import { logger } from "./logger"

export class CurveWatchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = "CurveWatchError"
  }
}

/**
 * Gere les erreurs de maniere centralisee
 */
export function handleError(error: unknown, context?: string): CurveWatchError {
  let curveError: CurveWatchError

  if (error instanceof CurveWatchError) {
    curveError = error
  } else if (error instanceof TypeError) {
    curveError = new CurveWatchError("Erreur de type invalide", "TYPE_ERROR", 400, { originalError: error.message })
  } else if (error instanceof RangeError) {
    curveError = new CurveWatchError("Valeur hors limites", "RANGE_ERROR", 400, { originalError: error.message })
  } else if (error instanceof SyntaxError) {
    curveError = new CurveWatchError("Erreur de syntaxe", "SYNTAX_ERROR", 400, { originalError: error.message })
  } else {
    const message = error instanceof Error ? error.message : String(error)
    curveError = new CurveWatchError(message, "UNKNOWN_ERROR", 500, { originalError: message })
  }

  logger.error(`Error${context ? ` in ${context}` : ""}`, {
    code: curveError.code,
    message: curveError.message,
    details: curveError.details,
  })

  return curveError
}

/**
 * Retry logic avec exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
  backoffMultiplier = 2,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed`, { error: lastError.message })

      if (attempt < maxAttempts) {
        const delayWithBackoff = delayMs * Math.pow(backoffMultiplier, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delayWithBackoff))
      }
    }
  }

  throw lastError || new CurveWatchError("All retry attempts failed", "RETRY_FAILED", 500)
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch (error) {
    logger.warn("JSON parse failed", { error: String(error) })
    return fallback
  }
}
