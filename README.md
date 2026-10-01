# Puzzimori

Little puzzles. Big discoveries. A bilingual emoji algebra adventure built with Next.js, React, TypeScript, and CSS Modules.

## Run locally

Use **Node.js 24** (see `.nvmrc`) and **pnpm 11.21.0**.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3000>. Start playing, select an adventure, and discover the number behind each emoji. Switch to Hebrew using the language control. All progress stays in the current browser; no accounts, analytics, database, or AI service is required.

## Learning experience

All ten themes from the original conversation are included. Puzzles are generated from seeded constraints, rather than a fixed worksheet list. Every clue introduces exactly one new unknown and has a unique whole-number solution. The guided solver shows all clues while helping children solve one emoji at a time.

Hints identify a useful clue, substitute already discovered values, and explain a strategy. They never show the target answer. Correct values appear only after the child supplies them. Solutions are computed locally, so this is a learning aid rather than an anti-cheating system.

Difficulty is controlled by the player. Changing it starts a fresh puzzle; after attempts or hints, a confirmation protects the current puzzle. After three consecutive completions with at most one hint per puzzle, the app suggests the next level without changing it automatically.

| Level | Symbols | Values | Operations                           | Maximum equation total |
| ----- | ------- | ------ | ------------------------------------ | ---------------------- |
| 1     | 2       | 1–5    | Addition                             | 30                     |
| 2     | 3       | 1–8    | Addition                             | 30                     |
| 3     | 4       | 1–10   | Addition                             | 30                     |
| 4     | 4       | 1–10   | Addition, subtraction                | 50                     |
| 5     | 4       | 1–12   | Addition, subtraction                | 50                     |
| 6     | 4       | 1–12   | Add multiplication, factors up to 5  | 100                    |
| 7     | 4       | 1–12   | Multiplication factors up to 10      | 100                    |
| 8     | 4       | 1–12   | Add exact division, divisors up to 5 | 100                    |
| 9     | 4       | 1–12   | Division divisors up to 10           | 100                    |
| 10    | 5       | 1–20   | All four operations                  | 200                    |

Subtraction is nonnegative and division has integer intermediate results. Each operation enabled at a level appears in every generated puzzle. Equal emoji values are permitted: different pictures do not have to represent different numbers.

## Architecture

- `src/engine`: typed expression trees, seeded generation, difficulty constraints, independent validation, and semantic hints. No React, Next.js, storage, or translation imports.
- `src/game`: pure reducers for attempts, hints, language preferences, and completion statistics.
- `src/storage`: a versioned localStorage adapter that regenerates and checks persisted puzzle metadata before accepting a saved game. Invalid saved games are rejected; unavailable storage falls back to memory. Existing selected-profile progress migrates to a single game save without names, avatars, or player IDs.
- `src/i18n`: complete English/Hebrew messages, emoji labels, operation names, and hint strategies.
- `src/components`: responsive screens and scoped styles. `src/app` supplies the server-rendered application shell and metadata.

The generator accepts `{ seed, theme, difficulty, engineVersion: 1 }`. Reusing these options yields the same puzzle. Up to 32 generation attempts are checked for correctness before a validated constructive fallback. Preserve engine version 1 behavior when changing code; a new generation algorithm must receive a new persistence version or explicit migration.

The language switch sets page language and direction while mathematical expressions remain LTR. Native dialogs protect in-progress puzzles, restore focus, and support Escape. Reduced motion is respected. Keyboard answers, a number pad, emoji labels, and live feedback are included.

## Verification and Repnix

```sh
pnpm exec playwright install chromium
pnpm verify
```

`verify` runs Repnix health, dependency auditing, the production build, and browser tests. Individual commands:

```sh
pnpm health
pnpm exec repnix audit --details
pnpm test:run
pnpm build
pnpm test:e2e
```

Repnix requires type, lint, format, tests, accessibility, dead-code, and architecture coverage. Providers are TypeScript, ESLint with JSX accessibility rules, Prettier, Vitest, Knip, and dependency-cruiser. Architecture rules prohibit cycles and engine dependencies on framework or storage code. The project starts without a findings baseline or disabled quality rules.

Tests cover 1,000 seeds at each of 10 levels, hint boundaries, arithmetic errors, game transitions, persistence validation, legacy-save migration, and translation completeness. Playwright covers desktop/mobile, English/Hebrew, all-operation puzzles, confirmation/cancellation, keyboard input, storage failures, reload/resume, and progression suggestions. GitHub Actions executes the same verification.

pnpm allows the `unrs-resolver` installation script for its native resolver dependency; other package build scripts need an explicit decision. Vitest is pinned to 5.0.2, which predates the package manager's release-age cutoff at creation time.

## Deploy to Vercel

No environment variables are needed.

1. Push the project to your Git provider when ready to publish.
2. Import it into Vercel and keep the detected **Next.js** framework preset and repository root directory.
3. Use `pnpm install --frozen-lockfile` for installation and `pnpm build` for the build. Select Node.js 24.
4. Set the project name to `puzzimori`, deploy, and check the project's Domains settings.

The intended address is **puzzimori.vercel.app**. Preliminary checks on September 30, 2026 found no public GitHub/GitLab repository-name matches and `DEPLOYMENT_NOT_FOUND` at that address. This is not a reservation: Vercel confirms availability when assigning the alias. If it is unavailable at deployment, choose an alternative with the user.

Progress belongs to each browser and origin. Localhost progress will not transfer to the deployed site, and devices do not synchronize. Clearing browser data removes saved progress. Live deployment and publication are outside the initial local delivery.

The Menu's challenge slider previews a level. Press “Start level” to request a new puzzle at that level in the current puzzle's theme. If an unfinished puzzle has attempts or hints, confirmation is required before replacing it. Cancelling preserves both the current puzzle and the preferred difficulty. Choosing a world from the adventure gallery uses the preferred difficulty; the resume card shows the unfinished puzzle's original level.

The child-focused game uses a permanently visible keypad and a read-only answer display. Physical digits enter answers; Enter checks, Backspace erases, and Delete clears. Letter keys are ignored. The current clue is repeated next to the keypad, while the full clue board and solved values stay visible. Keyboard shortcuts are active only during an unfinished game and do not intercept the difficulty slider or modified shortcuts.
