/** Allow only same-origin relative paths (blocks open redirects). */
export function sanitizeNextPath(next: unknown): string {
  if (typeof next !== 'string' || !next) return '/';

  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/';
  }

  // Reject protocol-relative or absolute URLs smuggled in.
  if (trimmed.includes('://')) {
    return '/';
  }

  return trimmed;
}
