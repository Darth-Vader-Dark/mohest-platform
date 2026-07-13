/**
 * Sanitize free-text search input before Prisma queries.
 * Prisma parameterizes values (no SQL injection), but we still cap length
 * and strip control characters to reduce abuse.
 */
export function sanitizeSearchInput(value?: string): string | undefined {
  if (value == null || typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, 100).replace(/[\x00-\x1f\x7f]/g, '');
  return trimmed.length ? trimmed : undefined;
}
