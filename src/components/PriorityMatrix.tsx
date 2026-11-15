import { LEVELS, PRIORITY_MATRIX, type PriorityResult } from '../triage';

/** The 3×3 impact × urgency grid with the ticket's cell highlighted. */
export function PriorityMatrix({ result }: { result: PriorityResult }) {
  return (
    <div className="matrix-wrap">
      <table className="matrix" aria-label={`Priority matrix. Impact ${result.impact}, urgency ${result.urgency}, gives P${result.basePriority}.`}>
        <thead>
          <tr>
            <th scope="col" className="matrix-corner">
              <span>Impact ↓</span>
              <span>Urgency →</span>
            </th>
            {LEVELS.map((u) => (
              <th key={u} scope="col" className={u === result.urgency ? 'is-axis' : ''}>{u}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LEVELS.map((i) => (
            <tr key={i}>
              <th scope="row" className={i === result.impact ? 'is-axis' : ''}>{i}</th>
              {LEVELS.map((u) => {
                const p = PRIORITY_MATRIX[i][u];
                const active = i === result.impact && u === result.urgency;
                return (
                  <td key={u} className={`cell p${p} ${active ? 'is-active' : ''}`} aria-current={active || undefined}>
                    P{p}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {result.upliftApplied && (
        <p className="uplift">
          <span className="tag tag-accent">Race uplift</span> P{result.basePriority} → <b>P{result.priority}</b>
        </p>
      )}
    </div>
  );
}
