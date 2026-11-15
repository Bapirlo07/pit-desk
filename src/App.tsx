import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Queue } from './components/Queue';
import { TicketDetail } from './components/TicketDetail';
import { TicketForm } from './components/TicketForm';
import { buildDemoTickets } from './demo';
import { loadRaceWeekend, loadTickets, saveRaceWeekend, saveTickets } from './storage';
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

  const updateSelected = (patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));

  const addTicket = (input: TicketInput) => {
    const ticket: Ticket = { ...input, id: nextId(tickets), createdAt: Date.now(), status: 'open', stepsTried: [] };
    setTickets((ts) => [...ts, ticket]);
    setNow(Date.now());
    setSelectedId(ticket.id);
  };

  const loadDemo = () => {
    const t = Date.now();
    setTickets(buildDemoTickets(t));
    setRaceWeekend(true);
    setNow(t);
    setSelectedId(null);
  };

  return (
    <>
      <Header raceWeekend={raceWeekend} onToggleRaceWeekend={() => setRaceWeekend((r) => !r)} onLoadDemo={loadDemo} />
      <main className="layout">
        <TicketForm raceWeekend={raceWeekend} onSubmit={addTicket} />
        <Queue queue={queue} now={now} onOpen={setSelectedId} onLoadDemo={loadDemo} />
      </main>
      <TicketDetail
        item={selected}
        now={now}
        raceWeekend={raceWeekend}
        onClose={() => setSelectedId(null)}
        onToggleStep={(stepId) => {
          if (!selected) return;
          const steps = selected.ticket.stepsTried;
          updateSelected({ stepsTried: steps.includes(stepId) ? steps.filter((s) => s !== stepId) : [...steps, stepId] });
        }}
        onResolve={(resolution) => {
          updateSelected({ status: 'resolved', resolution, resolvedAt: Date.now() });
          setSelectedId(null);
        }}
        onReopen={() => updateSelected({ status: 'open', resolution: undefined, resolvedAt: undefined })}
        onDelete={() => {
          setTickets((ts) => ts.filter((t) => t.id !== selectedId));
          setSelectedId(null);
        }}
      />
    </>
  );
}
