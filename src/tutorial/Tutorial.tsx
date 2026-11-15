import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { placeCard, type Rect } from './position';
import { TUTORIAL_STEPS } from './steps';

interface Props {
  step: number | null;
  onStep: (index: number) => void;
  onClose: () => void;
  /** Changes whenever the ticket panel opens/closes, so the tour can stay on top. */
  layerKey: string | null;
}

const PAD = 6;

/**
 * The guided tour. It's a modal <dialog>, so it sits above the page (and above
 * the ticket panel) in the browser's top layer, traps focus and closes on Esc.
 */
export function Tutorial({ step, onStep, onClose, layerKey }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const open = step !== null;
  const current = step !== null ? TUTORIAL_STEPS[step] : null;
  const isLast = step === TUTORIAL_STEPS.length - 1;

  // Open/close, and re-raise above the ticket panel when that opens.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (!open) {
      if (d.open) d.close();
      return;
    }
    if (d.open) d.close(); // closing + reopening moves it to the top of the top layer
    d.showModal();
    nextRef.current?.focus();
  }, [open, layerKey]);

  // Track the target element's position.
  useLayoutEffect(() => {
    if (!current) return;
    const measure = () => {
      const el = current.target ? document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`) : null;
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      // Pad the highlight, but keep it inside the screen.
      const top = Math.max(2, r.top - PAD);
      const left = Math.max(2, r.left - PAD);
      const bottom = Math.min(window.innerHeight - 2, r.bottom + PAD);
      const right = Math.min(window.innerWidth - 2, r.right + PAD);
      setRect({ top, left, width: right - left, height: bottom - top });
    };
    const el = current.target ? document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`) : null;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    measure();
    // The ticket panel slides in, so measure again once it settles.
    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 260);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [current, layerKey]);

  // Place the card once we know its size.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !current) return;
    const { top, left } = placeCard(
      rect,
      { width: card.offsetWidth, height: card.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
    );
    setPos({ top, left });
  }, [rect, current]);

  useEffect(() => {
    if (open) nextRef.current?.focus();
  }, [step, open]);

  if (step === null || !current) return <dialog ref={dialogRef} className="tour" />;

  const go = (i: number) => {
    if (i < 0) return;
    if (i >= TUTORIAL_STEPS.length) return onClose();
    onStep(i);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(step + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step - 1);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="tour"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      onKeyDown={onKeyDown}
      onClose={() => {
        // Ignore the brief close while re-raising; a real close leaves it shut.
        if (!dialogRef.current?.open) onClose();
      }}
    >
      {rect ? (
        <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div ref={cardRef} className="tour-card" style={{ top: pos.top, left: pos.left }}>
        <p className="tour-progress">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </p>
        <h2 id="tour-title">{current.title}</h2>
        <p id="tour-body">{current.body}</p>
        <div className="tour-dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((s, i) => (
            <span key={s.id} className={i === step ? 'is-active' : i < step ? 'is-done' : ''} />
          ))}
        </div>
        <div className="tour-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            {isLast ? 'Close' : 'Skip tour'}
          </button>
          <span className="tour-spacer" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => go(step - 1)} disabled={step === 0}>
            Back
          </button>
          <button ref={nextRef} type="button" className="btn btn-primary btn-sm" onClick={() => go(step + 1)}>
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
