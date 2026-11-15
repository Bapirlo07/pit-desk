import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatAge, formatDateTime, nextActions, PROBLEM_THRESHOLD, type TriagedTicket } from '../triage';
import { EscalationNote } from './EscalationNote';
import { PriorityBadge } from './PriorityBadge';
import { PriorityMatrix } from './PriorityMatrix';

interface Props {
  item: TriagedTicket | null;
  now: number;
  raceWeekend: boolean;
  onClose: () => void;
  onToggleStep: (stepId: string) => void;
  onResolve: (resolution: string) => void;
  onReopen: () => void;
  onDelete: () => void;
}

const USERS_TEXT = { '1': '1 user', '2-10': '2–10 users', '10+': '10+ users' };
const BLOCKED_TEXT = { yes: 'No, fully blocked', partly: 'Partly', no: 'Yes, mostly' };

/** Ticket detail, shown in a native <dialog> (focus trap + Esc to close for free). */
export function TicketDetail(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = props.item !== null;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      aria-labelledby="detail-title"
      onClose={props.onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      {props.item && <DetailBody key={props.item.ticket.id} {...props} item={props.item} />}
    </dialog>
  );
}

function DetailBody({ item, now, raceWeekend, onClose, onToggleStep, onResolve, onReopen, onDelete }: Props & { item: TriagedTicket }) {
  const { ticket, triage: t, problemCount } = item;
  const [mode, setMode] = useState<'idle' | 'resolving' | 'deleting'>('idle');
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState('');
  const resolved = ticket.status === 'resolved';
  const triedCount = ticket.stepsTried.filter((s) => t.article.checks.some((c) => c.id === s)).length;

  const submitResolve = (e: FormEvent) => {
    e.preventDefault();
    if (!resolution.trim()) {
      setError('Add a one-line resolution note.');
      return;
    }
    onResolve(resolution.trim());
  };

  return (
    <div className="drawer-inner">
      <div className="drawer-head">
        <PriorityBadge priority={t.priority.priority} large />
        <div className="drawer-heading">
          <h2 id="detail-title">
            <span className="mono">{ticket.id}</span> · {t.classification.type}
          </h2>
          <p className="muted">
            {t.article.name} · {ticket.location} · logged {formatDateTime(ticket.createdAt)} ({formatAge(now - ticket.createdAt)} ago)
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close ticket">✕</button>
      </div>

      <div className="drawer-body">
        {resolved ? (
          <div className="callout callout-ok">
            <b>Resolved</b> {ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : ''}: {ticket.resolution}
          </div>
        ) : (
          <div className="next-step">
            <p className="label">What to do next</p>
            {nextActions(ticket, t, problemCount).map((line) => <p key={line}>{line}</p>)}
          </div>
        )}

        {problemCount && !resolved && (
          <div className="callout callout-warn" role="note">
            <b>Possible underlying problem.</b> {problemCount} open {t.article.name} incidents (threshold {PROBLEM_THRESHOLD}).
          </div>
        )}

        <section className="detail-section">
          <h3>The problem</h3>
          <blockquote>{ticket.description}</blockquote>
          <dl className="facts">
            <div><dt>People</dt><dd>{USERS_TEXT[ticket.usersAffected]}</dd></div>
            <div><dt>Where</dt><dd>{ticket.location}</dd></div>
            <div><dt>Can work?</dt><dd>{BLOCKED_TEXT[ticket.blocked]}</dd></div>
          </dl>
        </section>

        <section className="detail-section">
          <h3>
            Try these first <span className="muted">({triedCount}/{t.article.checks.length} done)</span>
          </h3>
          {t.article.caution && <p className="caution">⚠ {t.article.caution}</p>}
          <ul className="checks">
            {t.article.checks.map((c) => (
              <li key={c.id}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={ticket.stepsTried.includes(c.id)}
                    onChange={() => onToggleStep(c.id)}
                    disabled={resolved}
                  />
                  <span>{c.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <h3>Still not fixed? Escalate</h3>
          <EscalationNote item={item} now={now} raceWeekend={raceWeekend} />
        </section>

        <section className="detail-section">
          <details className="why-details">
            <summary>Why is this P{t.priority.priority}?</summary>
            <div className="why">
              <PriorityMatrix result={t.priority} />
              <ul className="reasons">
                {t.priority.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
            <p className="muted small">
              {t.classification.defaulted
                ? 'No type keywords matched, so it is treated as an Incident (safe default).'
                : `Type keywords: ${t.classification.matched.map((m) => `“${m}”`).join(', ')}.`}
              {t.categoryMatched.length > 0 && ` Category keywords: ${t.categoryMatched.map((m) => `“${m}”`).join(', ')}.`}
            </p>
          </details>
        </section>
      </div>

      <div className="drawer-foot">
        {mode === 'resolving' ? (
          <form className="resolve-form" onSubmit={submitResolve}>
            <label htmlFor="resolution" className="sr-only">Resolution note</label>
            <input
              id="resolution"
              autoFocus
              value={resolution}
              placeholder="What fixed it? e.g. Reset password, user logged in"
              onChange={(e) => { setResolution(e.target.value); setError(''); }}
              aria-invalid={error ? true : undefined}
            />
            <button type="submit" className="btn btn-primary">Resolve</button>
            <button type="button" className="btn btn-ghost" onClick={() => setMode('idle')}>Cancel</button>
            {error && <p className="error full">{error}</p>}
          </form>
        ) : mode === 'deleting' ? (
          <div className="resolve-form">
            <span>Delete {ticket.id} permanently?</span>
            <button type="button" className="btn btn-danger" autoFocus onClick={onDelete}>Yes, delete</button>
            <button type="button" className="btn btn-ghost" onClick={() => setMode('idle')}>Cancel</button>
          </div>
        ) : (
          <>
            {resolved ? (
              <button type="button" className="btn btn-secondary" onClick={onReopen}>Reopen</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setMode('resolving')}>Mark resolved</button>
            )}
            <button type="button" className="btn btn-ghost danger-text" onClick={() => setMode('deleting')}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
