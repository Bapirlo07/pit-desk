import { formatAge, type TriagedTicket } from '../triage';
import { PriorityBadge } from './PriorityBadge';

interface Props {
  queue: TriagedTicket[];
  now: number;
  raceWeekend: boolean;
  onOpen: (id: string) => void;
  onStartTutorial: () => void;
}

function QueueItem({ item, now, onOpen }: { item: TriagedTicket; now: number; onOpen: (id: string) => void }) {
  const { ticket, triage: t, problemCount } = item;
  const resolved = ticket.status === 'resolved';
  return (
    <li>
      <button
        type="button"
        className={`ticket p${t.priority.priority} ${resolved ? 'is-resolved' : ''}`}
        onClick={() => onOpen(ticket.id)}
      >
        <PriorityBadge priority={t.priority.priority} />
        <span className="ticket-main">
          <span className="ticket-desc">{ticket.description}</span>
          <span className="ticket-meta">
            <span className="mono">{ticket.id}</span>
            <span>{t.classification.type}</span>
            <span>{t.article.name}</span>
            <span>{ticket.location}</span>
          </span>
          {(problemCount || t.priority.upliftApplied) && !resolved && (
            <span className="ticket-tags">
              {t.priority.upliftApplied && <span className="tag tag-accent">Race uplift</span>}
              {problemCount && <span className="tag tag-warn">Possible problem ({problemCount})</span>}
            </span>
          )}
        </span>
        <span className="ticket-age">
          {resolved ? 'Resolved' : formatAge(now - ticket.createdAt)}
        </span>
      </button>
    </li>
  );
}

export function Queue({ queue, now, raceWeekend, onOpen, onStartTutorial }: Props) {
  const open = queue.filter((q) => q.ticket.status === 'open');
  const resolved = queue
    .filter((q) => q.ticket.status === 'resolved')
    .sort((a, b) => (b.ticket.resolvedAt ?? 0) - (a.ticket.resolvedAt ?? 0));
  const counts = [1, 2, 3, 4].map((p) => open.filter((q) => q.triage.priority.priority === p).length);

  return (
    <section className="panel queue-panel" aria-labelledby="queue-heading" data-tour="queue">
      <div className="queue-head">
        <h2 id="queue-heading" className="panel-title">
          Live queue <span className="count">{open.length} open</span>
        </h2>
        <div className="queue-summary" aria-label="Open tickets by priority">
          {counts.map((c, i) => (
            <span key={i} className={`summary-pill p${i + 1}`}>P{i + 1} <b>{c}</b></span>
          ))}
        </div>
      </div>
      {raceWeekend && (
        <p className="race-banner">Race weekend ON: Mission Control and Trackside tickets are raised one priority level.</p>
      )}

      {open.length === 0 ? (
        <div className="empty">
          <p>No open tickets.</p>
          <p className="muted">Log one on the left, or press <b>Load race-weekend demo</b>.</p>
          <button type="button" className="btn btn-secondary empty-cta" onClick={onStartTutorial}>
            New here? Take the 1-minute tour
          </button>
        </div>
      ) : (
        <ol className="ticket-list">
          {open.map((item) => (
            <QueueItem key={item.ticket.id} item={item} now={now} onOpen={onOpen} />
          ))}
        </ol>
      )}

      {resolved.length > 0 && (
        <details className="resolved">
          <summary>Resolved ({resolved.length})</summary>
          <ol className="ticket-list">
            {resolved.map((item) => (
              <QueueItem key={item.ticket.id} item={item} now={now} onOpen={onOpen} />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
