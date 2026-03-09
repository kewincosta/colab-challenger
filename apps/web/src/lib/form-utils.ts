/**
 * Extracts human-readable messages from Zod Standard Schema validation errors.
 * Zod 3.25+ returns `{ message: string }` objects instead of plain strings.
 */
export function extractErrors(errors: unknown[]): string {
  const messages = errors.map((e) => {
    if (typeof e === 'string') return e;
    if (typeof e === 'object' && e !== null && 'message' in e) {
      return String((e as Record<string, unknown>).message);
    }
    return String(e);
  });
  return [...new Set(messages)].join('; ');
}
