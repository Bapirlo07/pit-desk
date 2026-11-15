import type { Classification } from './types';

/**
 * Keyword rules for classification. Deliberately simple and readable:
 * an analyst should be able to look at this file and predict the result.
 */

/** Something that used to work has stopped. */
export const INCIDENT_KEYWORDS = [
  "can't", 'cannot', 'can not', 'unable', 'down', 'not working', "isn't working", "won't",
  "doesn't work", 'stopped', 'crashed', 'crash', 'crashing', 'error', 'failed', 'failing',
  'lost', 'slow', 'no signal', 'frozen', 'freezing', 'broken', 'offline', 'no internet',
  'forgot', 'locked out', 'locked', 'expired', 'missing', 'disconnected', 'keeps dropping',
  'phishing', 'suspicious',
];

/** Asking for something standard. */
export const REQUEST_KEYWORDS = [
  'new', 'install', 'access to', 'second monitor', 'new starter', 'laptop for', 'request',
  'please add', 'need a', 'would like', 'wants a', 'set up', 'setup', 'licence', 'license',
  'upgrade', 'additional',
];

/** Normalise smart quotes and case so "Can’t" matches "can't". */
export function normalise(text: string): string {
  return text.toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/\s+/g, ' ');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word / whole-phrase match, so "down" doesn't match "download". */
export function containsKeyword(text: string, keyword: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(normalise(keyword))}(?![a-z0-9])`);
  return pattern.test(normalise(text));
}

export function matchKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((k) => containsKeyword(text, k));
}

/**
 * Incident vs service request.
 * - More incident keywords than request keywords (or a tie) → Incident.
 * - More request keywords → Service request.
 * - Nothing matched → Incident (the safe default: treat it as broken until shown otherwise).
 */
export function classifyType(description: string): Classification {
  const incident = matchKeywords(description, INCIDENT_KEYWORDS);
  const request = matchKeywords(description, REQUEST_KEYWORDS);

  if (incident.length === 0 && request.length === 0) {
    return { type: 'Incident', matched: [], defaulted: true };
  }
  if (request.length > incident.length) {
    return { type: 'Service request', matched: request, defaulted: false };
  }
  return { type: 'Incident', matched: incident, defaulted: false };
}

/** A category with this many open incidents is flagged as a possible problem. */
export const PROBLEM_THRESHOLD = 3;
