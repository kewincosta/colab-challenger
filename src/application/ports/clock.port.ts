/**
 * Clock abstraction for deterministic date handling.
 *
 * Inject this in use cases instead of calling `new Date()` directly
 * to enable deterministic testing without relying on real system time.
 */

export interface ClockPort {
  now(): Date;
}
