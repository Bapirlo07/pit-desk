import { useEffect, useRef, useState } from 'react';
import { buildEscalationNote, type TriagedTicket } from '../triage';

interface Props {
  item: TriagedTicket;
  now: number;
  raceWeekend: boolean;
}

/** One-click copy of the escalation note, with an optional preview. */
export function EscalationNote({ item, now, raceWeekend }: Props) {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Rebuilt from current state, so ticking a check updates the note.
  const note = buildEscalationNote(item.ticket, item.triage, { now, raceWeekend, problemCount: item.problemCount });

  useEffect(() => {
    if (status !== 'copied') return;
    const t = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [status]);

  // If copying failed, the note is shown and selected so the user can press Ctrl+C.
  useEffect(() => {
    if (status === 'failed') textRef.current?.select();
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setStatus('copied');
    } catch {
      setShow(true);
      setStatus('failed');
    }
  };

  return (
    <div className="note">
      <div className="note-actions">
        <button type="button" className="btn btn-primary" onClick={copy}>
          {status === 'copied' ? 'Copied ✓' : 'Copy handover note'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShow((s) => !s)} aria-expanded={show}>
          {show ? 'Hide note' : 'Preview note'}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{status === 'copied' ? 'Handover note copied. Paste it into your ticket system or an email.' : ''}</p>
      {status === 'failed' && <p className="error">Couldn't copy automatically. The text is selected, press Ctrl+C.</p>}
      {show && (
        <textarea ref={textRef} className="note-text" readOnly value={note} rows={18} aria-label="Handover note text" />
      )}
    </div>
  );
}
