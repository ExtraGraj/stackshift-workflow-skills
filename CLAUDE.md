# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A monorepo (pnpm workspaces) containing:
- **`skills/`** — Agentic skill files (Markdown + JSON) that AI agents load at runtime to implement StackShift sections
- **`cli/`** — A TypeScript CLI (`npx stackshift init`) that installs skills into target projects

The skills themselves are not executed code — they are structured Markdown documents that AI agents read as instructions. The CLI is the only runnable TypeScript in this repo.

## Commands

All CLI commands run from the `cli/` directory:

```bash
# Build the CLI
cd cli && pnpm build       # tsc → outputs to cli/dist/

# Run CLI in dev (without building)
cd cli && pnpm dev         # tsx src/index.ts

# Run the interactive installer
npx stackshift init
```

From the repo root:
```bash
pnpm install               # install all workspace deps
```

There are no tests.

## Architecture

### Skill System

Skills install to `.agents/skills/` in target projects (or `~/.agents/skills/` for global). An AI agent reads `SKILL.md` as its entry point and loads additional files on demand — never all at once.

**`stackshift-core`** is the authoritative skill package. It contains:
- `SKILL.md` — router: enforces the 5-step workflow order, lookup table, hard rules
- `workflow/1-5.md` — one file per step, loaded only when that step is active
- `protocols/` — convention library; each file is a named protocol with a tier
- `protocols/_registry.json` — the only index the CLI and bootstrap read; adding a protocol requires a new entry here
- `references/` — lookup tables (field factories, GROQ fragments, types, file map, versions); discoverable only via the router table in `SKILL.md` Section 3
- `bootstrap/` — first-run install flow for materializing protocols into `/docs/protocol/` in target projects
- `seeds/_registry.json` — seed strategies registry (empty in v0.1.0)

**Protocol tier bundles** (`stackshift-protocols-required`, `stackshift-protocols-recommended`, `stackshift-protocols-full`) each contain only a `SKILL.md` index. All protocol content lives in `stackshift-core/protocols/`. Tiers are `required` / `recommended` / `optional`.

### CLI Architecture

The CLI is a thin orchestrator (`cli/src/`):
- `index.ts` — entry; routes `stackshift init`
- `install.ts` — runs the install flow using `@clack/prompts`
- `registry.ts` — reads `skills/` directory and `protocols/_registry.json` via gray-matter frontmatter; skill type and tier are inferred from folder name if not in frontmatter
- `prompts.ts` — interactive tier and scope selection
- `writer.ts` — copies skill folders to the target install path

The CLI reads the `skills/` directory at runtime relative to its own `__dirname` — `registry.ts` resolves `../../skills` from `src/`. After `tsc`, the compiled `dist/` files maintain the same relative path to `skills/`.

### Extending

- **New protocol** → add `.md` to `protocols/`, register in `protocols/_registry.json`. For multi-file protocols use a directory and set `"dir"` instead of `"file"` in the registry entry.
- **New workflow step** → add file to `workflow/`, add row to the step table in `SKILL.md` Section 1, update `workflow/checklist.md`.
- **New reference lookup** → add file to `references/`, add matching row to the lookup router in `SKILL.md` Section 3. Files not listed there are unreachable by the workflow.
- **After any structural change** → increment `skill.version`.

### Bootstrap Flow

On first AI invocation in a target project (no `.stackshift/installed.json`), the skill runs `bootstrap/install.md`: prompts for install mode, copies selected protocols to `/docs/protocol/`, writes the marker file. Project copies in `/docs/protocol/` take precedence over bundled skill copies at every subsequent lookup.
