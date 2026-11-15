import type { Blocked, Level, Location, Priority, PriorityResult, UsersAffected } from './types';

export const LEVELS: Level[] = ['High', 'Medium', 'Low'];

/** Locations where an outage directly affects running the car. */
export const RACE_CRITICAL_LOCATIONS: Location[] = ['Mission Control', 'Trackside'];

/**
 * ITIL-style impact × urgency matrix.
 *               Urgency: High  Medium  Low
 * Impact High            P1    P2      P3
 * Impact Medium          P2    P3      P4
 * Impact Low             P3    P4      P4
 */
export const PRIORITY_MATRIX: Record<Level, Record<Level, Priority>> = {
  High: { High: 1, Medium: 2, Low: 3 },
  Medium: { High: 2, Medium: 3, Low: 4 },
  Low: { High: 3, Medium: 4, Low: 4 },
};

const USERS_TO_IMPACT: Record<UsersAffected, Level> = { '1': 'Low', '2-10': 'Medium', '10+': 'High' };
const BLOCKED_TO_URGENCY: Record<Blocked, Level> = { yes: 'High', partly: 'Medium', no: 'Low' };

function raiseLevel(level: Level): Level {
  return level === 'Low' ? 'Medium' : 'High';
}

/** Impact = how many people, raised one level for race-critical locations. */
export function getImpact(users: UsersAffected, location: Location): Level {
  const base = USERS_TO_IMPACT[users];
  return RACE_CRITICAL_LOCATIONS.includes(location) ? raiseLevel(base) : base;
}

/** Urgency = how badly work is blocked right now. */
export function getUrgency(blocked: Blocked): Level {
  return BLOCKED_TO_URGENCY[blocked];
}

export function calculatePriority(
  input: { usersAffected: UsersAffected; location: Location; blocked: Blocked },
  raceWeekend: boolean,
): PriorityResult {
  const impact = getImpact(input.usersAffected, input.location);
  const urgency = getUrgency(input.blocked);
  const basePriority = PRIORITY_MATRIX[impact][urgency];
  const critical = RACE_CRITICAL_LOCATIONS.includes(input.location);

  const reasons: string[] = [];
  const who = input.usersAffected === '1' ? '1 user' : `${input.usersAffected} users`;
  const baseImpact = USERS_TO_IMPACT[input.usersAffected];
  const locationNote = !critical
    ? ''
    : baseImpact === 'High'
      ? ` (${input.location} is race-critical, already the highest impact)`
      : `, raised one level because ${input.location} is race-critical`;
  reasons.push(`Impact ${impact}: ${who} affected${locationNote}.`);
  const blockedText = { yes: 'work is fully blocked', partly: 'work is partly blocked', no: 'work is not blocked' }[input.blocked];
  reasons.push(`Urgency ${urgency}: ${blockedText}.`);
  reasons.push(`Matrix: ${impact} impact × ${urgency} urgency = P${basePriority}.`);

  let priority = basePriority;
  let upliftApplied = false;
  if (raceWeekend && critical) {
    if (basePriority > 1) {
      priority = (basePriority - 1) as Priority;
      upliftApplied = true;
      reasons.push(`Race weekend: ${input.location} raised one level, P${basePriority} → P${priority}.`);
    } else {
      reasons.push('Race weekend: already P1, the highest level.');
    }
  }

  return { impact, urgency, basePriority, priority, upliftApplied, reasons };
}
