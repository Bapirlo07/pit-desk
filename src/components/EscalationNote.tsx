import { useEffect, useRef, useState } from 'react';
import { buildEscalationNote, type TriagedTicket } from '../triage';

async function copyText(text: string, fallbackEl: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API can be blocked (non-HTTPS, permissions). Fall back to select + copy.
    if (!fallbackEl) return false;
    fallbackEl.focus();
    fallbackEl.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

interface Props {
  item: TriagedTicket;
  now: number;
  raceWeekend: boolean;
}

export function EscalationNote({ item, now, raceWeekend }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Rebuilt from current state, so ticking a check updates the note.
  const note = buildEscalationNote(item.ticket, item.triage, { now, raceWeekend, problemCount: item.problemCount });

  useEffect(() => {
    if (status === 'idle') return;
    const t = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [status]);

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Generate escalation note
      </button>
    );
  }

  return (
    <div className="note">
      <div className="note-head">
        <span className="label">Escalation note</span>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={async () => setStatus((await copyText(note, textRef.current)) ? 'copied' : 'failed')}
        >
          {status === 'copied' ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <textarea ref={textRef} className="note-text" readOnly value={note} rows={18} aria-label="Escalation note text" />
      <p className="sr-only" aria-live="polite">
        {status === 'copied' ? 'Escalation note copied to clipboard' : status === 'failed' ? 'Copy failed, text is selected' : ''}
      </p>
      {status === 'failed' && <p className="error">Couldn't copy automatically. The text is selected, press Ctrl+C.</p>}
    </div>
  );
}
