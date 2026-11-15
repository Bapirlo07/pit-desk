import { describe, expect, it } from 'vitest';
import {
  buildEscalationNote,
  calculatePriority,
  classifyType,
  detectCategory,
  findProblemCategories,
  formatAge,
  triage,
  triageQueue,
  type Ticket,
  type TicketInput,
} from '../index';

const NOW = new Date('2026-11-15T14:00:00').getTime();

function makeTicket(overrides: Partial<Ticket> & Pick<TicketInput, 'description'>): Ticket {
  return {
    id: 'PD-0001',
    usersAffected: '1',
    location: 'Office',
    blocked: 'partly',
    createdAt: NOW - 10 * 60_000,
    status: 'open',
    stepsTried: [],
    ...overrides,
  };
}

describe('classification', () => {
  it.each([
    ['15 engineers have lost the telemetry server', 'Incident'],
    ["Outlook can't send email", 'Incident'],
    ['Can’t print (smart quote)', 'Incident'],
    ['CAD app crashed and lost my changes', 'Incident'],
    ['Intern forgot their password and is locked out', 'Incident'],
    ['Manager wants a second monitor', 'Service request'],
    ['Please install Python for the new starter', 'Service request'],
    ['Need access to the strategy shared drive', 'Service request'],
  ])('"%s" → %s', (text, expected) => {
    expect(classifyType(text).type).toBe(expected);
  });

  it('defaults to Incident when nothing matches', () => {
    const result = classifyType('Hello, quick question');
    expect(result).toEqual({ type: 'Incident', matched: [], defaulted: true });
  });

  it('matches whole words only ("download" is not "down")', () => {
    expect(classifyType('download the new telemetry viewer').matched).not.toContain('down');
  });
});

describe('category detection', () => {
  it.each([
    ['No internet, DNS not resolving', 'network'],
    ['Outlook stuck with an item in the Outbox', 'email'],
    ['Locked out after password expired', 'account'],
    ['Second monitor says no signal through the dock', 'display'],
    ['Printer has a paper jam', 'printer'],
    ['Laptop is really slow and freezing', 'slow-pc'],
    ['Suspicious email asking for my password', 'security'],
    ['CAD app crashed', 'general'],
  ])('"%s" → %s', (text, expected) => {
    const type = classifyType(text).type;
    expect(detectCategory(text, type).article.id).toBe(expected);
  });

  it('offers software install only for service requests', () => {
    expect(detectCategory('Please install the new CAD software', 'Service request').article.id).toBe('software');
    expect(detectCategory('CAD software crashed', 'Incident').article.id).toBe('general');
  });
});

describe('priority matrix', () => {
  it.each([
    // users, location, blocked, expected priority (race weekend OFF)
    ['10+', 'Office', 'yes', 1],
    ['10+', 'Office', 'partly', 2],
    ['10+', 'Office', 'no', 3],
    ['2-10', 'Factory', 'yes', 2],
    ['2-10', 'Factory', 'partly', 3],
    ['2-10', 'Factory', 'no', 4],
    ['1', 'Office', 'yes', 3],
    ['1', 'Office', 'partly', 4],
    ['1', 'Office', 'no', 4],
  ] as const)('%s users / %s / blocked=%s → P%i', (usersAffected, location, blocked, expected) => {
    expect(calculatePriority({ usersAffected, location, blocked }, false).priority).toBe(expected);
  });

  it('race-critical location raises impact one level', () => {
    const office = calculatePriority({ usersAffected: '1', location: 'Office', blocked: 'partly' }, false);
    const trackside = calculatePriority({ usersAffected: '1', location: 'Trackside', blocked: 'partly' }, false);
    expect(office.impact).toBe('Low');
    expect(trackside.impact).toBe('Medium');
    expect(trackside.priority).toBe(3);
  });

  it('explains the result in plain reasons', () => {
    const r = calculatePriority({ usersAffected: '10+', location: 'Office', blocked: 'yes' }, false);
    expect(r.reasons.join(' ')).toContain('High impact + High urgency = P1');
  });
});

describe('race weekend uplift', () => {
  const trackside = { usersAffected: '1', location: 'Trackside', blocked: 'partly' } as const;

  it('raises Mission Control / Trackside one level when ON', () => {
    const r = calculatePriority(trackside, true);
    expect(r.basePriority).toBe(3);
    expect(r.priority).toBe(2);
    expect(r.upliftApplied).toBe(true);
  });

  it('does nothing when OFF', () => {
    expect(calculatePriority(trackside, false).priority).toBe(3);
  });

  it('does not affect other locations', () => {
    const r = calculatePriority({ ...trackside, location: 'Factory' }, true);
    expect(r.priority).toBe(4);
    expect(r.upliftApplied).toBe(false);
  });

  it('never goes above P1', () => {
    const r = calculatePriority({ usersAffected: '10+', location: 'Mission Control', blocked: 'yes' }, true);
    expect(r.priority).toBe(1);
    expect(r.upliftApplied).toBe(false);
    expect(r.reasons[0]).toContain('already the highest impact');
  });
});

describe('possible problem detection', () => {
  const vpn = (id: string, extra: Partial<Ticket> = {}) =>
    makeTicket({ id, description: "VPN won't connect from home", ...extra });

  it('flags a category with 3+ open incidents', () => {
    const queue = triageQueue([vpn('PD-1'), vpn('PD-2'), vpn('PD-3')], false);
    expect(queue.every((q) => q.problemCount === 3)).toBe(true);
  });

  it('does not flag 2 incidents', () => {
    const queue = triageQueue([vpn('PD-1'), vpn('PD-2')], false);
    expect(queue.every((q) => q.problemCount === null)).toBe(true);
  });

  it('ignores resolved tickets and service requests', () => {
    const counts = findProblemCategories([
      { status: 'open', type: 'Incident', category: 'network' },
      { status: 'open', type: 'Incident', category: 'network' },
      { status: 'resolved', type: 'Incident', category: 'network' },
      { status: 'open', type: 'Service request', category: 'network' },
    ]);
    expect(counts.size).toBe(0);
  });

  it('ignores the general bucket', () => {
    const counts = findProblemCategories(
      Array.from({ length: 4 }, () => ({ status: 'open' as const, type: 'Incident', category: 'general' as const })),
    );
    expect(counts.size).toBe(0);
  });
});

describe('queue ordering', () => {
  it('sorts by priority, then oldest first', () => {
    const queue = triageQueue(
      [
        makeTicket({ id: 'low-new', description: 'need a mouse', blocked: 'no', createdAt: NOW - 1000 }),
        makeTicket({ id: 'p1', description: 'server down', usersAffected: '10+', blocked: 'yes', createdAt: NOW }),
        makeTicket({ id: 'low-old', description: 'need a keyboard', blocked: 'no', createdAt: NOW - 5000 }),
      ],
      false,
    );
    expect(queue.map((q) => q.ticket.id)).toEqual(['p1', 'low-old', 'low-new']);
  });
});

describe('escalation note', () => {
  const ticket = makeTicket({
    id: 'PD-0042',
    description: "15 engineers in Mission Control have lost the telemetry server, can't see live car data",
    usersAffected: '10+',
    location: 'Mission Control',
    blocked: 'yes',
    stepsTried: ['net-scope', 'net-ping'],
  });
  const t = triage(ticket, true);
  const note = buildEscalationNote(ticket, t, { now: NOW, raceWeekend: true, problemCount: 3 });

  it('contains every required section', () => {
    for (const heading of [
      'SUMMARY',
      'PRIORITY & WHY',
      'USERS / LOCATION AFFECTED',
      'BUSINESS IMPACT',
      "SYMPTOMS (user's words)",
      'STEPS TRIED',
      'STEPS NOT TRIED',
      'NEXT ACTION',
    ]) {
      expect(note).toContain(heading);
    }
  });

  it('records priority, location, and the user’s own words', () => {
    expect(note).toContain('P1 (Impact High, Urgency High)');
    expect(note).toContain('10+ users at Mission Control');
    expect(note).toContain(`"${ticket.description}"`);
    expect(note).toContain('open 10 min');
    expect(note).toContain('Race weekend in progress');
  });

  it('splits ticked and unticked checks', () => {
    const [tried, notTried] = note.split('STEPS NOT TRIED');
    expect(tried).toContain('Check who is affected');
    expect(tried).toContain('reach the router');
    expect(notTried).toContain('nslookup');
    expect(notTried).not.toContain('reach the router');
  });

  it('escalates P1 and flags possible problem', () => {
    expect(note).toContain('pass this to the Network team now');
    expect(note).toContain('something bigger may be broken');
  });

  it('never states a cause as fact', () => {
    expect(note).toContain('CAUSE\nNot yet confirmed.');
    expect(note).not.toMatch(/caused by|root cause is|due to/i);
  });

  it('routes service requests as requests', () => {
    const req = makeTicket({ description: 'Manager wants a second monitor', blocked: 'no' });
    const reqNote = buildEscalationNote(req, triage(req, false), { now: NOW, raceWeekend: false });
    expect(reqNote).toContain('This is a request, not a fault');
    expect(reqNote).toContain('STEPS TRIED\n- None');
  });
});

describe('formatAge', () => {
  it.each([
    [0, 'just now'],
    [5 * 60_000, '5 min'],
    [65 * 60_000, '1 h 5 min'],
    [120 * 60_000, '2 h'],
    [26 * 3_600_000, '1 d 2 h'],
  ])('%i ms → %s', (ms, expected) => expect(formatAge(ms)).toBe(expected));
});
