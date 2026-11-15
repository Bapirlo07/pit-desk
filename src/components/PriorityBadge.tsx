import type { Priority } from '../triage';

export function PriorityBadge({ priority, large = false }: { priority: Priority; large?: boolean }) {
  return (
    <span className={`badge p${priority} ${large ? 'badge-lg' : ''}`} aria-label={`Priority ${priority}`}>
      P{priority}
    </span>
  );
}
