import { useSyncExternalStore } from 'react';
import { canInstall, isRunningAsApp, promptInstall, subscribeInstall } from '../pwa';

interface Props {
  raceWeekend: boolean;
  onToggleRaceWeekend: () => void;
  onLoadDemo: () => void;
}

export function Header({ raceWeekend, onToggleRaceWeekend, onLoadDemo }: Props) {
  // Only shows when the browser says the app can be installed (Chrome/Edge, Android).
  const installable = useSyncExternalStore(subscribeInstall, canInstall, () => false) && !isRunningAsApp();

  return (
    <header className="header">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M8 22V10h7a4 4 0 0 1 0 8h-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="23" cy="22" r="2.5" fill="currentColor" />
        </svg>
        <div>
          <h1>Pit Desk</h1>
          <p className="brand-sub">Race weekend ticket triage</p>
        </div>
      </div>
      <div className="header-actions">
        <button
          type="button"
          role="switch"
          aria-checked={raceWeekend}
          className={`switch ${raceWeekend ? 'is-on' : ''}`}
          onClick={onToggleRaceWeekend}
          title="When on, Mission Control and Trackside tickets jump up one priority level"
        >
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span>Race weekend</span>
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLoadDemo}>
          Try sample tickets
        </button>
        {installable && (
          <button type="button" className="btn btn-ghost btn-install" onClick={() => void promptInstall()}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Install app
          </button>
        )}
      </div>
    </header>
  );
}
