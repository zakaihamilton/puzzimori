# Working on Puzzimori

- Use Node.js 24 and the pinned pnpm version. Install with `pnpm install --frozen-lockfile`.
- Before changing Next.js behavior, read the version-matched documentation in `node_modules/next/dist/docs/`. This project uses the App Router and a client gameplay boundary.
- Keep `src/engine` independent of React, Next.js, browser APIs, persistence, and localization. Expressions are data; never evaluate source strings.
- Preserve the unique solution and sequential solvability invariants. Each newly introduced operation must occur in generated puzzles at that level.
- Hints may reference only the current equation and correctly solved earlier symbols. Never display the target answer before the child solves it.
- Translate all user-facing additions into English and Hebrew. Keep equations LTR inside RTL layouts. Use CSS Modules and logical CSS properties.
- Save actual unfinished puzzles with versioned metadata. Reject corrupted state; never silently substitute different answers into a saved puzzle.
- Run `pnpm verify` before delivery. Fix findings rather than creating baselines or disabling quality rules. Browser tests require `pnpm exec playwright install chromium`.
- Deployment and external publication require the user's authorization; normal local development does not.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
