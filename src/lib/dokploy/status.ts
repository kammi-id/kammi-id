/**
 * Outcome of a Dokploy deployment, as seen by the caller driving it.
 */
export type DeploymentOutcome = 'running' | 'success' | 'failure' | 'timeout'

/**
 * Non-terminal values of `applicationStatus` on `application.one` /
 * `postgres.one` (`db/schema/application.ts` and `postgres.ts` upstream).
 * Dokploy has no `timeout` status of its own — a caller infers it by polling
 * past a deadline while the status is still one of these.
 */
const NON_TERMINAL_STATUSES = new Set(['idle', 'running'])

/**
 * Turns a raw `applicationStatus`, the deadline, and whether this deploy has
 * changed status into one of four outcomes. A pre-existing `done` cannot be
 * mistaken for the result of the deploy just requested. A status outside the
 * known set is treated as a failure rather than left to poll forever — the
 * known set was read off a live instance, not documented, so an unfamiliar
 * value must fail loud.
 */
export const interpretApplicationStatus = (
  applicationStatus: string,
  timedOut: boolean,
  hasObservedStatusTransition = true
): DeploymentOutcome => {
  if (applicationStatus === 'done') {
    if (hasObservedStatusTransition) return 'success'
    return timedOut ? 'timeout' : 'running'
  }
  if (applicationStatus === 'error') return 'failure'
  if (!NON_TERMINAL_STATUSES.has(applicationStatus)) return 'failure'
  return timedOut ? 'timeout' : 'running'
}
