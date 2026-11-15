# File guide: what each file does

Pit Desk is split into three layers. Each layer only depends on the one below it.

```
UI (src/components, src/tutorial/Tutorial.tsx, src/App.tsx)
   ↓ calls
Triage logic (src/triage/*): pure functions, no React, fully unit-tested
   ↓ reads
Data (knowledge base, keyword lists, demo tickets, tutorial steps)
```

**If you want to change…**

| Change | Edit |
| --- | --- |
| Which words make something an incident or request | `src/triage/rules.ts` |
| Categories, first-line checks, escalation teams | `src/triage/knowledgeBase.ts` |
| The priority matrix or race-weekend rule | `src/triage/priority.ts` |
| What the escalation note says | `src/triage/escalation.ts` |
| The tutorial text | `src/tutorial/steps.ts` |
| The demo tickets | `src/demo.ts` |
| Colours and layout | `src/styles.css` (colour tokens are at the top) |

## Triage logic: `src/triage/`

This is the "brain". Plain TypeScript functions: data in, answer out. No screen code, so it's easy to test and explain.

| File | What it does |
| --- | --- |
| `types.ts` | Defines the shapes used everywhere: `Ticket`, `Priority` (1–4), `Level` (High/Medium/Low), the lists of locations, user counts and "blocked" options. |
| `rules.ts` | Keyword lists for **Incident** vs **Service request**, and `classifyType()`, which counts matches. More request words → request. Otherwise → incident. No match → incident (the safe default). Whole-word matching, so "down" doesn't match "download". Also holds `PROBLEM_THRESHOLD = 3`. |
| `knowledgeBase.ts` | The 8 categories plus a general fallback. Each has its keywords, ordered first-line checks, an optional caution ("don't delete the Outlook profile first") and the team to escalate to. `detectCategory()` picks the category with the most keyword hits. |
| `priority.ts` | The ITIL-style **impact × urgency matrix**. Users affected → impact, raised one level for Mission Control/Trackside. Blocked → urgency. Matrix → P1–P4. With race weekend on, those locations go up one more level, capped at P1. It also writes the plain-English "why" reasons. |
| `problems.ts` | `findProblemCategories()`: counts open incidents per category and returns those with 3 or more (possible underlying problem). |
| `escalation.ts` | `buildEscalationNote()`: builds the paste-ready note (summary, priority & why, impact, user's words, steps tried / not tried, next action). Cause is always "Not yet confirmed". |
| `time.ts` | Formats "open for" ages (`12 min`, `1 h 5 min`) and timestamps. |
| `index.ts` | The front door. `triage()` runs one ticket through all the rules. `triageQueue()` triages the whole queue, adds problem flags and sorts by priority, then age. The UI imports everything from here. |
| `__tests__/triage.test.ts` | Unit tests: classification, categories, every matrix cell, race uplift, problem detection, queue order, escalation note contents. |

## Screens: `src/components/`

| File | What it shows |
| --- | --- |
| `Header.tsx` | App name, **Race weekend** switch, **Load race-weekend demo**, **Tutorial**, and **Install app** (only shown when the browser can install it). |
| `TicketForm.tsx` | The New ticket form, plus the **live triage preview** that updates as you type. |
| `Queue.tsx` | The live queue: priority badge, ID, type, category, location, age, and the *Race uplift* / *Possible problem* tags. Also the priority counters and the collapsible Resolved list. |
| `TicketDetail.tsx` | The side panel when you open a ticket: symptoms, matched keywords, the matrix and reasons, checklist, escalation, and Resolve / Reopen / Delete. Uses a native `<dialog>`, which gives focus trapping and Esc to close for free. |
| `PriorityMatrix.tsx` | The 3×3 grid with this ticket's cell highlighted, plus "P3 → P2" when race uplift applies. |
| `EscalationNote.tsx` | The Generate button, the note text and **Copy** (with a fallback if the clipboard is blocked). |
| `PriorityBadge.tsx` | The small coloured P1–P4 label. |

## Tutorial: `src/tutorial/`

| File | What it does |
| --- | --- |
| `steps.ts` | The tour's content as data: title, text, which element to highlight (`data-tour="…"`), and whether the step needs demo tickets or an open ticket. |
| `position.ts` | Pure maths for where the tutorial card goes: below the highlight, else above, else beside it, else docked to a screen edge. Unit-tested. |
| `Tutorial.tsx` | The tour itself: dims the screen, spotlights the target, shows the card, and handles Next/Back/arrow keys/Esc. It's a modal `<dialog>` that re-raises itself above the ticket panel when that opens. |
| `__tests__/tutorial.test.ts` | Tests for card placement and step data. |

## App glue: `src/`

| File | What it does |
| --- | --- |
| `main.tsx` | Starting point. Registers the service worker and install prompt, then renders `<App/>`. |
| `App.tsx` | Holds the state: tickets, race-weekend flag, which ticket is open, tutorial step. Connects components to each other and to storage. Priority is **calculated on every render, never stored**, so flipping race weekend re-sorts everything instantly. |
| `storage.ts` | Saves and loads tickets, the race-weekend flag and "tutorial seen" in `localStorage`. Every read/write is in try/catch and stored data is validated, so a blocked or corrupt storage never crashes the app. |
| `demo.ts` | The 4 race-weekend demo tickets, created with staggered times so ages look real. |
| `pwa.ts` | Browser-app install support: registers the service worker (website production only, skipped in the desktop app) and captures the browser's install prompt for the **Install app** button. |
| `styles.css` | All styling. Colour tokens at the top (`--accent`, `--p1`…`--p4`), then sections for header, form, queue, drawer, matrix, tutorial and mobile breakpoints. |

## App / offline files: `public/`

Copied as-is into the build.

| File | What it does |
| --- | --- |
| `manifest.webmanifest` | Tells the browser this is an installable app: name, icons, colours, opens in its own window. |
| `sw.js` | Service worker: caches the app so it **works offline**. Pages: network first, cached copy if offline. Built JS/CSS: cache first, since the file names change on every build. |
| `icons/` | App icons (192, 512, Apple touch). |
| `favicon.svg` | Browser tab icon. |

## Desktop app: `src-tauri/`

The desktop app is the same web app inside a native window (Tauri). You normally never touch these files.

| File | What it does |
| --- | --- |
| `tauri.conf.json` | The main desktop settings: app name, window size, icons, installer types, and a strict content security policy. Its version is read from `package.json`. |
| `src/main.rs` | The tiny Rust program that opens the window and loads the built web app. No native features are exposed. |
| `Cargo.toml` | Rust dependencies (just Tauri) and size-optimised release settings. |
| `build.rs` | Standard Tauri build hook. |
| `capabilities/default.json` | Permissions: only the core window permissions, with no file, shell or network access. |
| `icons/` | Desktop icons in every format (`.ico` for Windows, `.icns` for macOS, PNGs for Linux), generated from `scripts/icon-1024.png` with `npx tauri icon`. |

## Config and project files

| File | What it does |
| --- | --- |
| `index.html` | The single HTML page. Links the manifest, icons and `src/main.tsx`. |
| `vite.config.ts` | Build tool config. `base` is `/pit-desk/` for the website (must match the repo name) and `./` when Tauri builds the desktop app. Also the Vitest settings. |
| `package.json` | Dependencies and scripts: `dev`, `build`, `test`, `preview`. |
| `tsconfig*.json` | TypeScript settings (strict mode). `tsconfig.app.json` covers `src/`, `tsconfig.node.json` covers the Vite config. |
| `.github/workflows/deploy.yml` | On every push to `main`: install → test → build → publish the **website** to GitHub Pages. If tests fail, nothing is deployed. |
| `.github/workflows/release.yml` | On a version tag (`v1.0.0`): builds the **desktop installers** on Windows, macOS and Linux and publishes them as a GitHub Release. |
| `scripts/icon.svg`, `icon-1024.png` | Source artwork for all app icons (web and desktop), plus a README with the commands to regenerate them. |
| `docs/` | README screenshots and this guide. |
| `.gitignore` | Keeps `node_modules/` and `dist/` out of git. |

## How a ticket flows through the code

1. You type in **`TicketForm.tsx`**. On every keystroke it calls `triage()` from **`src/triage/index.ts`** for the preview.
2. `triage()` calls `classifyType()` (**`rules.ts`**), then `detectCategory()` (**`knowledgeBase.ts`**), then `calculatePriority()` (**`priority.ts`**).
3. **Log ticket**: **`App.tsx`** adds the raw facts (no priority) to state, and **`storage.ts`** saves them.
4. **`App.tsx`** runs `triageQueue()` on the whole list. It re-triages everything, flags problems (**`problems.ts`**) and sorts.
5. **`Queue.tsx`** draws the sorted list. Clicking a ticket opens **`TicketDetail.tsx`**.
6. Ticking checks updates `stepsTried` on the ticket. **Generate escalation note** calls `buildEscalationNote()` (**`escalation.ts`**).
