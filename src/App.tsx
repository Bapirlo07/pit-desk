import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Queue } from './components/Queue';
import { TicketDetail } from './components/TicketDetail';
import { TicketForm } from './components/TicketForm';
import { buildDemoTickets } from './demo';
import { loadRaceWeekend, loadTickets, loadTutorialSeen, saveRaceWeekend, saveTickets, saveTutorialSeen } from './storage';
import { TUTORIAL_STEPS } from './tutorial/steps';
import { Tutorial } from './tutorial/Tutorial';
import { triageQueue, type Ticket, type TicketInput } from './triage';

function nextId(tickets: Ticket[]): string {
  const max = tickets.reduce((m, t) => Math.max(m, Number(t.id.replace(/\D/g, '')) || 0), 0);
  return `PD-${String(max + 1).padStart(4, '0')}`;
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [raceWeekend, setRaceWeekend] = useState<boolean>(loadRaceWeekend);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // First visit: start the tutorial automatically.
  const [tourStep, setTourStep] = useState<number | null>(() => (loadTutorialSeen() ? null : 0));

  useEffect(() => saveTickets(tickets), [tickets]);
  useEffect(() => saveRaceWeekend(raceWeekend), [raceWeekend]);

  // Keep "open for" ages fresh.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Priority is derived, never stored: flipping race weekend re-prioritises the queue live.
  const queue = useMemo(() => triageQueue(tickets, raceWeekend), [tickets, raceWeekend]);
  const selected = queue.find((q) => q.ticket.id === selectedId) ?? null;

  const updateTicket = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addTicket = (input: TicketInput) => {
    const ticket: Ticket = {
      ...input,
      id: nextId(tickets),
      createdAt: Date.now(),
      status: 'open',
      stepsTried: [],
    };
    setTickets((ts) => [...ts, ticket]);
    setNow(Date.now());
    setSelectedId(ticket.id);
  };

  const loadDemo = () => {
    const t = Date.now();
    const demo = buildDemoTickets(t);
    setTickets(demo);
    setRaceWeekend(true);
    setNow(t);
    setSelectedId(null);
    return demo;
  };

  // Each tutorial step can ask for demo tickets and/or the top ticket to be open.
  const goToTourStep = (index: number) => {
    const step = TUTORIAL_STEPS[index];
    let current = tickets;
    let race = raceWeekend;
    if (step.needsTickets && !current.some((t) => t.status === 'open')) {
      current = loadDemo();
      race = true;
    }
    const top = triageQueue(current, race).find((q) => q.ticket.status === 'open');
    setSelectedId(step.openTopTicket && top ? top.ticket.id : null);
    setTourStep(index);
  };

  const startTour = () => goToTourStep(0);
  const endTour = () => {
    setTourStep(null);
    saveTutorialSeen();
  };

  return (
    <>
      <Header
        raceWeekend={raceWeekend}
        onToggleRaceWeekend={() => setRaceWeekend((r) => !r)}
        onLoadDemo={loadDemo}
        onStartTutorial={startTour}
      />
      <main className="layout">
        <TicketForm raceWeekend={raceWeekend} onSubmit={addTicket} />
        <Queue queue={queue} now={now} raceWeekend={raceWeekend} onOpen={setSelectedId} onStartTutorial={startTour} />
      </main>
      <TicketDetail
        item={selected}
        now={now}
        raceWeekend={raceWeekend}
        onClose={() => setSelectedId(null)}
        onToggleStep={(stepId) => {
          if (!selected) return;
          const steps = selected.ticket.stepsTried;
          updateTicket(selected.ticket.id, {
            stepsTried: steps.includes(stepId) ? steps.filter((s) => s !== stepId) : [...steps, stepId],
          });
        }}
        onResolve={(resolution) => {
          if (!selected) return;
          updateTicket(selected.ticket.id, { status: 'resolved', resolution, resolvedAt: Date.now() });
          setSelectedId(null);
        }}
        onReopen={() => {
          if (!selected) return;
          updateTicket(selected.ticket.id, { status: 'open', resolution: undefined, resolvedAt: undefined });
        }}
        onDelete={() => {
          if (!selected) return;
          setTickets((ts) => ts.filter((t) => t.id !== selected.ticket.id));
          setSelectedId(null);
        }}
      />
      {/* After TicketDetail on purpose: its effects run later, so the tour stays on top. */}
      <Tutorial step={tourStep} onStep={goToTourStep} onClose={endTour} layerKey={selectedId} />
    </>
  );
}
