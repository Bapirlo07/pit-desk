import { RACE_CRITICAL_LOCATIONS } from './priority';
import { formatAge, formatDateTime } from './time';
import type { Triage } from './index';
import type { Ticket } from './types';

const BLOCKED_TEXT = { yes: 'Work fully blocked', partly: 'Work partly blocked', no: 'Work not blocked (degraded/inconvenience)' };

/**
 * What the analyst should do next, in plain words. Shown at the top of the
 * ticket and used as the NEXT ACTION section of the escalation note.
 */
export function nextActions(ticket: Ticket, t: Triage, problemCount?: number | null): string[] {
  const { article, classification, priority } = t;
  const notTried = article.checks.filter((c) => !ticket.stepsTried.includes(c.id));
  const next: string[] = [];
  if (classification.type === 'Service request') {
    next.push(`Fulfil as a standard service request via ${article.escalateTo}. Confirm line-manager approval first.`);
  } else if (priority.priority === 1) {
    next.push(`Escalate now to ${article.escalateTo} and notify the duty manager. Continue remaining checks in parallel.`);
  } else if (notTried.length > 0) {
    next.push(`Complete remaining first-line checks. If unresolved, escalate to ${article.escalateTo}.`);
  } else {
    next.push(`All first-line checks done. Escalate to ${article.escalateTo}.`);
  }
  if (problemCount) {
    next.push(`${problemCount} open ${article.name} incidents: possible underlying problem, raise for root-cause investigation.`);
  }
  return next;
}

/**
 * Build a factual escalation note ready to paste into a ticketing system.
 * It records what the user reported and what was checked. It never states a
 * cause, because the cause hasn't been confirmed yet.
 */
export function buildEscalationNote(
  ticket: Ticket,
  t: Triage,
  options: { now: number; raceWeekend: boolean; problemCount?: number | null },
): string {
  const { article, classification, priority } = t;
  const tried = article.checks.filter((c) => ticket.stepsTried.includes(c.id));
  const notTried = article.checks.filter((c) => !ticket.stepsTried.includes(c.id));
  const users = ticket.usersAffected === '1' ? '1 user' : `${ticket.usersAffected} users`;
  const description = ticket.description.trim().replace(/\s+/g, ' ');
  const shortDesc = description.length > 90 ? `${description.slice(0, 87)}...` : description;

  const impactLines = [`${BLOCKED_TEXT[ticket.blocked]} for ${users} at ${ticket.location}.`];
  if (options.raceWeekend && RACE_CRITICAL_LOCATIONS.includes(ticket.location)) {
    impactLines.push(`Race weekend in progress and ${ticket.location} is race-critical.`);
  }

  const next = nextActions(ticket, t, options.problemCount);

  const list = (items: { text: string }[]) => (items.length ? items.map((c) => `- ${c.text}`).join('\n') : '- None');

  return [
    `ESCALATION NOTE: ${ticket.id}`,
    `Logged: ${formatDateTime(ticket.createdAt)} (open ${formatAge(options.now - ticket.createdAt)})`,
    '',
    'SUMMARY',
    `${classification.type} | ${article.name} | ${ticket.location}`,
    shortDesc,
    '',
    'PRIORITY & WHY',
    `P${priority.priority} (Impact ${priority.impact}, Urgency ${priority.urgency})`,
    ...priority.reasons.map((r) => `- ${r}`),
    '',
    'USERS / LOCATION AFFECTED',
    `${users} at ${ticket.location}`,
    '',
    'BUSINESS IMPACT',
    ...impactLines,
    '',
    "SYMPTOMS (user's words)",
    `"${description}"`,
    '',
    'STEPS TRIED',
    list(tried),
    '',
    'STEPS NOT TRIED',
    list(notTried),
    '',
    'CAUSE',
    'Not yet confirmed.',
    '',
    'NEXT ACTION',
    ...next,
  ].join('\n');
}
