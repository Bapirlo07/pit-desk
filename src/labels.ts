import type { Priority, TicketType } from './triage';

/**
 * Everyday words for the screen. The triage logic keeps its standard IT terms
 * (Incident, P1…), and these turn them into something anyone can follow.
 */
export const PRIORITY_NAME: Record<Priority, string> = { 1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low' };
export const PRIORITY_HINT: Record<Priority, string> = {
  1: 'drop everything',
  2: 'next up',
  3: 'when free',
  4: 'can wait',
};
export const TYPE_LABEL: Record<TicketType, string> = { Incident: 'Something broken', 'Service request': 'Request' };
