# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A monorepo (pnpm workspaces) containing:
- **`skills/`** — Agentic skill files (Markdown + JSON) that AI agents load at runtime to implement StackShift sections
- **`cli/`** — A TypeScript CLI (`npx @extragraj/stackshift-skills init`) that installs skills into target projects

The skills themselves are not executed code — they are structured Markdown documents that AI agents read as instructions. The CLI is the only runnable TypeScript in this repo.

## Commands

All CLI commands run from the `cli/` directory:

```bash
# Build the CLI
cd cli && pnpm build       # tsc → outputs to cli/dist/

# Run CLI in dev (without building)
cd cli && pnpm dev         # tsx src/index.ts

# Run the interactive installer
npx @extragraj/stackshift-skills init
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
- `bootstrap/` — first-run install flow for materializing protocols into `.stackshift/protocols/` in target projects
- `seeds/` — seed strategies; each strategy has a canonical `.md` file here and a discoverable stub in `skills/stackshift-seed-<name>/`; `_registry.json` is the index

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
- **New seed strategy** → add canonical `.md` to `seeds/`, register in `seeds/_registry.json`, create a stub `skills/stackshift-seed-<name>/SKILL.md` pointing back to the canonical file.
- **New workflow step** → add file to `workflow/`, add row to the step table in `SKILL.md` Section 1, update `workflow/checklist.md`.
- **New reference lookup** → add file to `references/`, add matching row to the lookup router in `SKILL.md` Section 3. Files not listed there are unreachable by the workflow.
- **After any structural change** → increment `skill.version` and update `README.md`.

### Bootstrap Flow

On first AI invocation in a target project (no `.stackshift/installed.json`), the skill runs `bootstrap/install.md`: prompts for install mode, copies selected protocols to `.stackshift/protocols/`, writes the marker file. Project copies in `.stackshift/protocols/` take precedence over bundled skill copies at every subsequent lookup.

Bootstrap also wires up the StackShift ↔ UI Forge handshake when UI Forge is detected:

- Step 6c — resolves `${UI_FORGE_SKILL_DIR}` (prefers UI Forge's `scripts/detect.sh` ≥ 0.1.9; falls back to a 7-entry path lookup), runs `scan.js` if `design/design-arch.json` is missing, captures and surfaces the scan-fallback banner.
- Step 6g — runs `/forge-export-design` (or `export-design.js`) when the `claude-design-handoff` protocol is materialized to seed Claude Design with project tokens.
- Step 6h — writes a `_paired` mirror block into `design-arch.json` so UI Forge can read StackShift markers from one surface (canonical write target stays `.stackshift/installed.json`).
- Step 7b — registers a Claude Code `PostToolUse` hook in `.claude/settings.json` (idempotent merge) when the `auto-verify-hook` protocol is materialized.
- Step 8 — `.forgeignore` defaults include `design/.handoff-cache/` and `design/claude-design-bundle/` so UI Forge never walks regeneratable artifacts.

### Companion Skill (UI Forge)

StackShift delegates Step 4 variant body generation to the `ui-forge` companion skill. The two skills share state through three files:

- `.stackshift/installed.json` — StackShift writes (`mode`, `protocols`, `seed`, `skillVersion`, `a11yRequired`, `uiForgeIntegration`); UI Forge reads for paired-mode detection.
- `design/design-arch.json` — UI Forge owns most fields; StackShift writes `designStandards.*` pointers and the optional `_paired` mirror block.
- `.claude/settings.json` — receives the StackShift PostToolUse hook entry when `auto-verify-hook` is active.

The full handshake (skill-root resolution, marker fields, flag refusal matrix, modifier composition, contract version dance) lives in `skills/stackshift-core/protocols/paired-mode-contract.md`. Other paired protocols (`accessibility`, `brand`, `claude-design-handoff`, `auto-verify-hook`) link to that document instead of restating its rules.

When a UI Forge feature ships that StackShift should surface (e.g. new signal, new flag, new script), update:

1. `protocols/paired-mode-contract.md` if it changes the handshake.
2. `workflow/4-variants.md` if it changes Step 4 invocation, ref rules, postconditions, or failure modes.
3. `bootstrap/install.md` if it changes what bootstrap writes.
4. `references/versions.md` compatibility matrix.
5. `references/file-map.md` if it introduces or removes a project-side file.

### Versioning

The canonical version lives in `skill.version` (plain text, semver). Changes that update protocols, workflow, or bootstrap without altering the public CLI surface or breaking compatibility are tracked as **letter-suffixed sub-releases** (e.g. `0.1.9A`, `0.1.9B`) — a new file in `change-logs/` named `<x-y-zL>-short-description.md`, no version-number bump. Bump the numeric version only on breaking changes or when explicitly shipping a new minor/patch release.

### Documentation

`README.md` is the primary public-facing documentation. It must be kept up to date with every change — no exceptions.

**After any change to skills, CLI, or architecture, update README.md to reflect:**

- New or removed features (protocols, seeds, CLI flags, commands)
- Changed behaviour (prompts, flow, defaults, repair logic)
- Structural changes (new folders, renamed files, updated `installed.json` shape)
- Version references (intro line, repository structure, compatibility table)

**Documentation standards:**
- Descriptions in the intro and section headers must be concise and professional — state capabilities without implementation detail (e.g. "supports seed strategies", not "pre-fills `initialValue/` with placeholder content")
- All CLI prompt examples must match the actual output of the current code
- All file structure diagrams must reflect the current `skills/` directory layout
- Table entries for flags, protocols, and seeds must use their correct display names (title-case, no raw IDs)
