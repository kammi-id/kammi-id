// src/instrumentation.ts
import type { Instrumentation } from 'next'

/**
 * Called once when a new Next.js server instance boots, before it starts
 * handling requests. Configures LogTape so every `getLogger(...)` call
 * across the app writes to the console sink.
 *
 * Guarded by `NEXT_RUNTIME` because `instrumentation.ts` also runs in the
 * Edge runtime, where `@logtape/logtape`'s Node-oriented console sink isn't
 * needed (and importing it eagerly would bloat the edge bundle).
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { configureLogger } = await import('~/lib/logger/config')
    await configureLogger()
  }
}

/**
 * Safety net for *uncaught* server-side errors — RSC render crashes, route
 * handler throws, server actions that escape their own try/catch, etc. This
 * complements (does not replace) the manual `logger.error` calls inside
 * actions: those log expected failure paths with rich context, this one
 * catches whatever slips through.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const [{ getLogger }, { redact }] = await Promise.all([
    import('@logtape/logtape'),
    import('~/lib/logger/redact')
  ])

  const logger = getLogger(['app', 'request'])

  logger.error('Unhandled server error on {method} {path}: {error}', {
    method: request.method,
    path: request.path,
    headers: redact(request.headers),
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    error
  })
}
