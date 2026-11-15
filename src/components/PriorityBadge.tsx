import { PRIORITY_NAME } from '../labels';
import type { Priority } from '../triage';

/** Coloured P1–P4 label. `named` adds the everyday word, e.g. "P1 · Urgent". */
export function PriorityBadge({ priority, large = false, named = false }: { priority: Priority; large?: boolean; named?: boolean }) {
  return (
    <span
      className={`badge p${priority} ${large ? 'badge-lg' : ''}`}
      aria-label={`Priority ${priority}, ${PRIORITY_NAME[priority]}`}
      title={`P${priority} = ${PRIORITY_NAME[priority]}`}
    >
      P{priority}{named && ` · ${PRIORITY_NAME[priority]}`}
    </span>
  );
}
