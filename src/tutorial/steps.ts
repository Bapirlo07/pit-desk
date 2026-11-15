/**
 * The guided tutorial, as data. Each step can point at an element marked
 * with data-tour="<target>" and can ask the app to set the scene first.
 */
export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  /** data-tour attribute of the element to spotlight. No target = centred card. */
  target?: string;
  /** Load the demo tickets if the queue has no open tickets. */
  needsTickets?: boolean;
  /** Open the highest-priority open ticket (otherwise any open ticket is closed). */
  openTopTicket?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Pit Desk',
    body: 'A race-weekend IT service desk triage tool. This 1-minute tour shows how a ticket gets its type, category and priority, and how to escalate it. Use the arrow keys or the buttons. Press Esc to exit.',
  },
  {
    id: 'form',
    target: 'form',
    title: '1. Log the ticket',
    body: "Write what the user said in their own words, then record three facts: how many users are affected, where they are, and whether work is fully blocked. Those three facts set the priority.",
  },
  {
    id: 'preview',
    target: 'preview',
    title: 'Live triage preview',
    body: 'As you type, simple keyword rules decide Incident (something that worked has stopped) or Service request (asking for something standard), and pick a category. No AI, so every result can be explained.',
  },
  {
    id: 'race',
    target: 'race-toggle',
    title: 'Race weekend mode',
    body: 'When this is ON, Mission Control and Trackside tickets go up one priority level, never above P1. Flip it and the whole queue re-prioritises instantly.',
  },
  {
    id: 'queue',
    target: 'queue',
    needsTickets: true,
    title: '2. The live queue',
    body: 'Open tickets are sorted by priority, then oldest first, so a brand-new P1 jumps above an older P4. Colours run from P1 red to P4 grey. If the queue was empty, the race-weekend demo tickets were loaded.',
  },
  {
    id: 'matrix',
    target: 'matrix',
    needsTickets: true,
    openTopTicket: true,
    title: '3. Why this priority?',
    body: 'Impact (how many people, and where) × Urgency (how blocked they are) gives P1–P4 from an ITIL-style matrix. The highlighted cell is this ticket, and the reasons are written out so you can justify the call.',
  },
  {
    id: 'checks',
    target: 'checks',
    needsTickets: true,
    openTopTicket: true,
    title: '4. First-line checks',
    body: "Each category has an ordered checklist from the knowledge base. Work through it and tick what you've tried. Ticks are saved on the ticket as \"steps tried\".",
  },
  {
    id: 'escalation',
    target: 'escalation',
    needsTickets: true,
    openTopTicket: true,
    title: '5. Escalate with facts',
    body: "Generates a note ready to paste into the ticketing system: priority & why, business impact, the user's own words, and steps tried and not tried. It never states a guessed cause as fact.",
  },
  {
    id: 'actions',
    target: 'detail-actions',
    needsTickets: true,
    openTopTicket: true,
    title: '6. Close the loop',
    body: 'Mark resolved with a one-line resolution note (required), or delete a duplicate. Resolved tickets move to the Resolved list and can be reopened.',
  },
  {
    id: 'problems',
    target: 'queue',
    needsTickets: true,
    title: 'Spotting problems',
    body: 'If 3 or more open incidents share a category, they are flagged "possible underlying problem". That is the cue to raise it for root-cause investigation instead of fixing the same thing three times.',
  },
  {
    id: 'done',
    target: 'tutorial-button',
    title: "You're ready",
    body: "Try it: log \"Trackside printer won't print\" for 1 user, partly blocked. Then flip Race weekend and watch it move between P3 and P2. Replay this tour any time from here.",
  },
];
