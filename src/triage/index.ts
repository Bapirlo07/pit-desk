import { detectCategory } from './knowledgeBase';
import { findProblemCategories } from './problems';
import { calculatePriority } from './priority';
import { classifyType } from './rules';
import type { Classification, KnowledgeArticle, PriorityResult, Ticket, TicketInput } from './types';

export * from './types';
export { KNOWLEDGE_BASE, detectCategory, getArticle } from './knowledgeBase';
export { PRIORITY_MATRIX, LEVELS, RACE_CRITICAL_LOCATIONS, calculatePriority } from './priority';
export { classifyType, PROBLEM_THRESHOLD } from './rules';
export { findProblemCategories } from './problems';
export { buildEscalationNote, nextActions } from './escalation';
export { formatAge, formatDateTime } from './time';

export interface Triage {
  classification: Classification;
  article: KnowledgeArticle;
  categoryMatched: string[];
  priority: PriorityResult;
}

/** Triage a single ticket (no queue context). */
export function triage(input: TicketInput, raceWeekend: boolean): Triage {
  const classification = classifyType(input.description);
  const { article, matched } = detectCategory(input.description, classification.type);
  return {
    classification,
    article,
    categoryMatched: matched,
    priority: calculatePriority(input, raceWeekend),
  };
}

export interface TriagedTicket {
  ticket: Ticket;
  triage: Triage;
  /** Number of open incidents in this category, if it crossed the problem threshold. */
  problemCount: number | null;
}

/** Triage the whole queue, flag possible problems and sort open tickets by priority then age. */
export function triageQueue(tickets: Ticket[], raceWeekend: boolean): TriagedTicket[] {
  const triaged = tickets.map((ticket) => ({ ticket, triage: triage(ticket, raceWeekend) }));
  const problems = findProblemCategories(
    triaged.map(({ ticket, triage: t }) => ({
      status: ticket.status,
      type: t.classification.type,
      category: t.article.id,
    })),
  );
  return triaged
    .map(({ ticket, triage: t }) => ({
      ticket,
      triage: t,
      problemCount:
        ticket.status === 'open' && t.classification.type === 'Incident' ? (problems.get(t.article.id) ?? null) : null,
    }))
    .sort(compareTickets);
}

/** Priority first (P1 at top), then oldest first. */
export function compareTickets(a: TriagedTicket, b: TriagedTicket): number {
  return a.triage.priority.priority - b.triage.priority.priority || a.ticket.createdAt - b.ticket.createdAt;
}
