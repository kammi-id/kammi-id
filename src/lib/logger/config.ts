import { configure, getConsoleSink, getTextFormatter } from '@logtape/logtape'

/**
 * Plain, human-readable text formatter with no ANSI color codes — Dokploy's
 * web log viewer renders raw text, so escape sequences would show up as
 * garbage. Produces lines like:
 *
 *   [2026-06-08 15:30:00.000 +00] INFO app·action·organization: Organisasi dibuat
 */
export const textFormatter = getTextFormatter({
  timestamp: 'date-time-tz',
  level: 'FULL',
  category: '·',
  format: ({ timestamp, level, category, message }) =>
    `[${timestamp}] ${level} ${category}: ${message}`
})

/**
 * Configures LogTape for the whole app. Must be called exactly once, from
 * `src/instrumentation.ts#register`, before any logger is used.
 *
 * - Root category `["app"]` logs at `info` and above in production, and
 *   `debug` and above in development (`NODE_ENV`).
 * - `["logtape", "meta"]` is capped at `warning` to silence LogTape's own
 *   startup chatter.
 * - The single `console` sink routes by level: `console.error` for
 *   error/fatal, `console.warn` for warning, `console.info`/`console.log`
 *   otherwise — Docker captures both stdout and stderr, both visible in
 *   Dokploy's log viewer.
 */
export const configureLogger = async (): Promise<void> => {
  const isProduction = process.env.NODE_ENV === 'production'

  await configure({
    sinks: {
      console: getConsoleSink({ formatter: textFormatter })
    },
    loggers: [
      {
        category: ['app'],
        sinks: ['console'],
        lowestLevel: isProduction ? 'info' : 'debug'
      },
      {
        category: ['logtape', 'meta'],
        sinks: ['console'],
        lowestLevel: 'warning'
      }
    ]
  })
}
