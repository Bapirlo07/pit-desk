import { PROBLEM_THRESHOLD } from './rules';
import type { CategoryId } from './types';

/**
 * Possible-problem detection: if one category has PROBLEM_THRESHOLD or more
 * open incidents, they may share an underlying cause.
 * The 'general' bucket is ignored because its tickets aren't related.
 */
export function findProblemCategories(
  items: { status: 'open' | 'resolved'; type: string; category: CategoryId }[],
): Map<CategoryId, number> {
  const counts = new Map<CategoryId, number>();
  for (const item of items) {
    if (item.status !== 'open' || item.type !== 'Incident' || item.category === 'general') continue;
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  for (const [category, count] of counts) {
    if (count < PROBLEM_THRESHOLD) counts.delete(category);
  }
  return counts;
}
