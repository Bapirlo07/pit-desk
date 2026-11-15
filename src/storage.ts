import { BLOCKED, LOCATIONS, USERS_AFFECTED, type Ticket } from './triage';

const TICKETS_KEY = 'pit-desk:tickets:v1';
const RACE_KEY = 'pit-desk:race-weekend:v1';
const TUTORIAL_KEY = 'pit-desk:tutorial-seen:v1';

/** Storage can throw (private mode, blocked site data, quota). The app must still work. */
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* in-memory state still works for this session */
  }
}

function isTicket(x: unknown): x is Ticket {
  if (!x || typeof x !== 'object') return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.description === 'string' &&
    typeof t.createdAt === 'number' &&
    (t.status === 'open' || t.status === 'resolved') &&
    Array.isArray(t.stepsTried) &&
    (USERS_AFFECTED as readonly unknown[]).includes(t.usersAffected) &&
    (LOCATIONS as readonly unknown[]).includes(t.location) &&
    (BLOCKED as readonly unknown[]).includes(t.blocked)
  );
}

export function loadTickets(): Ticket[] {
  const raw = read(TICKETS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTicket) : [];
  } catch {
    return [];
  }
}

export function saveTickets(tickets: Ticket[]): void {
  write(TICKETS_KEY, JSON.stringify(tickets));
}

export function loadRaceWeekend(): boolean {
  return read(RACE_KEY) === 'true';
}

export function saveRaceWeekend(on: boolean): void {
  write(RACE_KEY, String(on));
}

export function loadTutorialSeen(): boolean {
  return read(TUTORIAL_KEY) === 'true';
}

export function saveTutorialSeen(): void {
  write(TUTORIAL_KEY, 'true');
}
