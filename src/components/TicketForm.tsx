import { useId, useState, type FormEvent } from 'react';
import { BLOCKED, LOCATIONS, USERS_AFFECTED, triage, type Blocked, type Location, type TicketInput, type UsersAffected } from '../triage';
import { PriorityBadge } from './PriorityBadge';

interface Props {
  raceWeekend: boolean;
  onSubmit: (input: TicketInput) => void;
}

const USERS_LABEL: Record<UsersAffected, string> = { '1': '1', '2-10': '2–10', '10+': '10+' };
const BLOCKED_LABEL: Record<Blocked, string> = { yes: 'Yes', partly: 'Partly', no: 'No' };

function Segmented<T extends string>(props: {
  legend: string;
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="field">
      <legend className="label">{props.legend}</legend>
      <div className="segmented">
        {props.options.map((opt) => (
          <label key={opt} className="segment">
            <input
              type="radio"
              name={props.name}
              value={opt}
              checked={props.value === opt}
              onChange={() => props.onChange(opt)}
            />
            <span>{props.labels[opt]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const EMPTY: TicketInput = { description: '', usersAffected: '1', location: 'Office', blocked: 'partly' };

export function TicketForm({ raceWeekend, onSubmit }: Props) {
  const [form, setForm] = useState<TicketInput>(EMPTY);
  const [error, setError] = useState('');
  const descId = useId();
  const locId = useId();

  const hasText = form.description.trim().length > 0;
  const preview = hasText ? triage(form, raceWeekend) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.description.trim().length < 5) {
      setError("Describe the issue in the user's words (at least a few words).");
      return;
    }
    onSubmit({ ...form, description: form.description.trim() });
    setForm(EMPTY);
    setError('');
  };

  return (
    <section className="panel form-panel" aria-labelledby="new-ticket-heading" data-tour="form">
      <h2 id="new-ticket-heading" className="panel-title">New ticket</h2>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor={descId} className="label">What's happening? <span className="muted">(user's words)</span></label>
          <textarea
            id={descId}
            rows={4}
            value={form.description}
            placeholder="e.g. Trackside printer won't print setup sheets"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${descId}-err` : undefined}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {error && <p id={`${descId}-err`} className="error">{error}</p>}
        </div>

        <Segmented
          legend="Users affected"
          name="users"
          options={USERS_AFFECTED}
          labels={USERS_LABEL}
          value={form.usersAffected}
          onChange={(usersAffected) => setForm({ ...form, usersAffected })}
        />

        <div className="field">
          <label htmlFor={locId} className="label">Location</label>
          <select
            id={locId}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value as Location })}
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <Segmented
          legend="Is work fully blocked?"
          name="blocked"
          options={BLOCKED}
          labels={BLOCKED_LABEL}
          value={form.blocked}
          onChange={(blocked) => setForm({ ...form, blocked })}
        />

        <div className="preview" aria-live="polite" data-tour="preview">
          {preview ? (
            <>
              <PriorityBadge priority={preview.priority.priority} />
              <span>{preview.classification.type}</span>
              <span className="dot" aria-hidden="true">·</span>
              <span>{preview.article.name}</span>
              {preview.priority.upliftApplied && <span className="tag tag-accent">Race uplift</span>}
            </>
          ) : (
            <span className="muted">Live triage preview appears as you type.</span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block">Log ticket</button>
      </form>
    </section>
  );
}
