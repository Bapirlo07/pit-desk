import { formatAge, type TriagedTicket } from '../triage';
import { PRIORITY_NAME, TYPE_LABEL } from '../labels';
import { PriorityBadge } from './PriorityBadge';

interface Props {
  queue: TriagedTicket[];
  now: number;
  onOpen: (id: string) => void;
  onLoadDemo: () => void;
  raceWeekend: boolean;
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
            <span>{TYPE_LABEL[t.classification.type]}</span>
            <span>{t.article.name}</span>
            <span>{ticket.location}</span>
          </span>
          {(problemCount || t.priority.upliftApplied) && !resolved && (
            <span className="ticket-tags">
              {t.priority.upliftApplied && <span className="tag tag-accent">Race weekend boost</span>}
              {problemCount && <span className="tag tag-warn">Same problem ×{problemCount}</span>}
            </span>
          )}
        </span>
        <span className="ticket-age">
          {resolved ? 'Fixed' : `${formatAge(now - ticket.createdAt)} ago`}
        </span>
      </button>
    </li>
  );
}

export function Queue({ queue, now, onOpen, onLoadDemo, raceWeekend }: Props) {
  const open = queue.filter((q) => q.ticket.status === 'open');
  const resolved = queue
    .filter((q) => q.ticket.status === 'resolved')
    .sort((a, b) => (b.ticket.resolvedAt ?? 0) - (a.ticket.resolvedAt ?? 0));
  const counts = [1, 2, 3, 4].map((p) => open.filter((q) => q.triage.priority.priority === p).length);

  return (
    <section className="panel queue-panel" aria-labelledby="queue-heading">
      <div className="queue-head">
        <h2 id="queue-heading" className="panel-title">
          To do <span className="count">{open.length} open</span>
        </h2>
        <div className="queue-summary" aria-label="Open tickets by priority">
          {counts.map((c, i) => (
            <span key={i} className={`summary-pill p${i + 1}`}>
              P{i + 1} {PRIORITY_NAME[(i + 1) as 1 | 2 | 3 | 4]} <b>{c}</b>
            </span>
          ))}
        </div>
      </div>
      {raceWeekend && (
        <p className="race-banner">Race weekend is on: problems at Mission Control and Trackside are moved up one level.</p>
      )}

      {open.length === 0 ? (
        <div className="empty">
          <p><b>No open tickets.</b></p>
          <ol className="how">
            <li><b>Describe the problem</b> and answer three quick questions.</li>
            <li>Pit Desk gives it a <b>priority</b>: P1 Urgent, P2 High, P3 Normal or P4 Low. The most urgent goes to the top.</li>
            <li><b>Click the ticket</b> to see what to do next, and tick each thing you try.</li>
            <li>Still broken? <b>Copy the handover note</b> for the expert team. Fixed? <b>Mark as fixed</b>.</li>
          </ol>
          <button type="button" className="btn btn-secondary" onClick={onLoadDemo}>
            Try sample tickets
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
          <summary>Fixed ({resolved.length})</summary>
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
