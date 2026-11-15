import type { Ticket } from './triage';

const MIN = 60_000;

/** Four realistic race-weekend tickets, logged at different times. */
export function buildDemoTickets(now: number): Ticket[] {
  const base = { status: 'open' as const, stepsTried: [] };
  return [
    {
      ...base,
      id: 'PD-0001',
      description: 'Manager wants a second monitor set up at their desk.',
      usersAffected: '1',
      location: 'Office',
      blocked: 'no',
      createdAt: now - 95 * MIN,
    },
    {
      ...base,
      id: 'PD-0002',
      description: 'Intern forgot their password and is now locked out of their laptop.',
      usersAffected: '1',
      location: 'Factory',
      blocked: 'yes',
      createdAt: now - 48 * MIN,
    },
    {
      ...base,
      id: 'PD-0003',
      description: 'CAD app crashed while saving a front-wing assembly. Error on reopen, user is stuck.',
      usersAffected: '1',
      location: 'Design Office',
      blocked: 'yes',
      createdAt: now - 22 * MIN,
    },
    {
      ...base,
      id: 'PD-0004',
      description:
        "15 engineers in Mission Control have lost the telemetry server. Can't see live car data, screens show a connection error.",
      usersAffected: '10+',
      location: 'Mission Control',
      blocked: 'yes',
      createdAt: now - 4 * MIN,
    },
  ];
}
