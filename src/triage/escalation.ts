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
    next.push(`This is a request, not a fault. Once their manager has approved it, pass it to ${article.escalateTo}.`);
  } else if (priority.priority === 1) {
    next.push(`Urgent: pass this to ${article.escalateTo} now and tell the manager on duty. Keep trying the checks while you wait.`);
  } else if (notTried.length > 0) {
    next.push(`Work through the checks. If it's still not fixed, pass it to ${article.escalateTo}.`);
  } else {
    next.push(`All checks done and still not fixed: pass it to ${article.escalateTo}.`);
  }
  if (problemCount) {
    next.push(
      `${problemCount} ${article.name} problems are open at once, so something bigger may be broken. Ask ${article.escalateTo} to find the cause.`,
    );
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
