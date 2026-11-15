export const USERS_AFFECTED = ['1', '2-10', '10+'] as const;
export type UsersAffected = (typeof USERS_AFFECTED)[number];

export const LOCATIONS = ['Office', 'Design Office', 'Factory', 'Mission Control', 'Trackside'] as const;
export type Location = (typeof LOCATIONS)[number];

export const BLOCKED = ['yes', 'partly', 'no'] as const;
export type Blocked = (typeof BLOCKED)[number];

export type TicketType = 'Incident' | 'Service request';
export type Level = 'High' | 'Medium' | 'Low';
export type Priority = 1 | 2 | 3 | 4;

export type CategoryId =
  | 'security'
  | 'network'
  | 'email'
  | 'account'
  | 'display'
  | 'printer'
  | 'slow-pc'
  | 'software'
  | 'general';

/** What the user tells us. Everything else is derived by the triage rules. */
export interface TicketInput {
  description: string;
  usersAffected: UsersAffected;
  location: Location;
  blocked: Blocked;
}

export interface Ticket extends TicketInput {
  id: string;
  createdAt: number;
  status: 'open' | 'resolved';
  /** IDs of knowledge-base checks the analyst has ticked. */
  stepsTried: string[];
  resolution?: string;
  resolvedAt?: number;
}

export interface Check {
  id: string;
  text: string;
}

export interface KnowledgeArticle {
  id: CategoryId;
  name: string;
  keywords: string[];
  checks: Check[];
  caution?: string;
  /** Only offer this category for service requests (e.g. software installs). */
  requestsOnly?: boolean;
  /** Team the ticket goes to if first-line checks don't fix it. */
  escalateTo: string;
}

export interface PriorityResult {
  impact: Level;
  urgency: Level;
  /** Priority straight from the matrix cell. */
  basePriority: Priority;
  /** Priority after race-weekend uplift. */
  priority: Priority;
  upliftApplied: boolean;
  reasons: string[];
}

export interface Classification {
  type: TicketType;
  matched: string[];
  defaulted: boolean;
}
