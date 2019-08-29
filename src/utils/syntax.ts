export const nullishCoalescing = <T = unknown>(value: T, fallback: T): T =>
  value === undefined || value === null ? fallback : value
