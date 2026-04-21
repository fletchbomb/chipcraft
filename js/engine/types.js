// Shared type-oriented helpers will be added here in future steps.
export function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}
