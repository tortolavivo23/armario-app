/**
 * Identifier for a locally created record. The timestamp keeps ids roughly
 * sortable and the suffix keeps two records made in the same millisecond apart.
 */
export function createId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
