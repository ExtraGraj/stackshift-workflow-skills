# StackShift Workflow Skill

> **Version** 0.2.5

A structured agentic skill for building sections and variants inside StackShift, a composable Sanity v3 and Next.js page-builder. Enforces a strict 5-step implementation workflow, governs quality through a tiered protocol system, supports seed strategies, and delegates component rendering to the `ui-forge` companion skill.

---

## Installation

Two installation methods are available. The `stackshift-core` package is required in all cases.

### Option A — Interactive CLI (Recommended)

An interactive command-line interface that handles tier selection, platform selection (supports multiple), install scope, and bootstrap materialization in a single guided flow. Prevents multi-tier conflicts and provides proper tier management.

```bash
# Interactive installation (recommended)
npx @extragraj/stackshift-skills init

# Non-interactive with defaults (recommended tier, project scope, agents platform)
npx @extragraj/stackshift-skills init --no-interactive

# Non-interactive with specific options
npx @extragraj/stackshift-skills init --tier full --scope project --platform agents,claude --no-interactive

# Non-interactive with seed strategy
npx @extragraj/stackshift-skills init --seed initialvalue-seeding --no-interactive

# Non-interactive with deferred bootstrap (all steps on first AI invocation)
npx @extragraj/stackshift-skills init --tier recommended --no-materialize --no-interactive
```

**Available Flags:**

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--tier` | `required`, `recommended`, `full` | `recommended` | Protocol tier to install |
| `--scope` | `project`, `global` | `project` | Install location |
| `--platform` | `agents`, `claude`, `copilot`, `gemini`, `cursor`, or comma-separated | `agents` | Platform(s) to install to |
| `--seed` | seed id or `none` | `none` | Seeding strategy to activate (e.g. `initialvalue-seeding`) |
| `--no-materialize` | (flag) | `false` | Skip CLI materialization; defer all steps to AI agent on first invocation |
| `--no-interactive` | (flag) | `false` | Skip prompts, use flags + defaults |
| `--help` | (flag) | - | Show help text |

**Note:** Custom tier selection requires interactive mode (not supported with `--no-interactive`).

#### Repair Command

If you encounter multi-tier, multi-seed, or stale materialized protocol issues:

```bash
npx @extragraj/stackshift-skills repair
```

This performs three reconciliation passes:
1. **Protocol bundles** — scans for multiple `stackshift-protocols-*` folders across all platforms; prompts to keep one and removes the rest.
2. **Seed folders** — scans for multiple `stackshift-seed-*` folders; prompts to keep one and removes the rest. Syncs `.stackshift/installed.json`.
3. **Materialized protocols** — reconciles `.stackshift/protocols/` against `.stackshift/installed.json`. Removes orphaned files and restores missing recorded protocols.

---

### Option B — Vercel Skills Add

Install skill packages directly using `npx skills add`:

```bash
# Universal agents (.agents/skills/) — project only
npx skills add extragraj/stackshift-workflow-skills -a agents

# Claude Code (.claude/skills/) — global
npx skills add extragraj/stackshift-workflow-skills -g -a claude-code

# Claude Code (.claude/skills/) — project only
npx skills add extragraj/stackshift-workflow-skills -a claude-code
```

**When using `npx skills add`, you MUST:**
1. Always install `stackshift-core` (required for the workflow system)
2. Install only **1 protocol tier bundle** — tiers are cumulative:
   - `stackshift-protocols-required` (4 required protocols)
   - `stackshift-protocols-recommended` (4 required + 7 recommended — default)
   - `stackshift-protocols-full` (all tiers)
3. Install only **1 seeding strategy** (optional). If you accidentally install multiple, run `npx @extragraj/stackshift-skills repair`, then `npx @extragraj/stackshift-skills init` to activate your chosen seed.

---

### Installation Method Comparison

| Feature | Option A — Interactive CLI | Option B — Vercel Skills Add |
|---------|---------------------------|----------------------------|
| **Tier enforcement** | Automatic | Manual |
| **Core installation** | Automatic | Manual |
| **Seed activation** | Automatic (guided prompt) | Manual (`npx init` after) |
| **Multi-tier prevention** | Yes | No (use `repair`) |
| **Multi-seed prevention** | Yes | No (use `repair`) |
| **Automation support** | Full (`--no-interactive`) | Limited |
| **Platforms supported** | `agents`, `claude`, `copilot`, `gemini`, `cursor` | `agents`, `claude` |
| **Bootstrap materialization** | Default (use `--no-materialize` to defer) | No (agent only) |

**Note:** The `ui-forge` companion skill must be installed independently; StackShift bootstrap detects and integrates it automatically when present.

---

## How the Skill Operates

StackShift sections follow a predictable anatomy: a Sanity schema defining fields, a TypeScript interface describing data shape, React variant components for rendering, and a GROQ query for data fetching. Every section progresses through five implementation steps in strict order:

```
1. Schema fields → 2. Section schema → 3. TypeScript types → 4. Component variant → 5. GROQ query
```

Each step produces output required by the subsequent step. Reordering introduces broken imports, type errors, and mismatched GROQ projections.

### Lookup-Table Architecture

The skill uses a lookup-table structure to keep context focused:
- **Core router** (`SKILL.md`) contains the workflow table, topic-to-file lookup table, and hard rules
- **Workflow steps** are stored in individual files; the router directs the agent to load only the relevant step
- **Protocols** are discovered via merged registries and loaded on demand
- **References** (field factories, GROQ fragments, type catalogs) are accessed through the lookup table

### Protocol System

A tiered protocol system codifies team conventions:

| Tier | Effect if Skipped |
|------|-------------------|
| **Required** | Build errors, runtime errors, or schema load failures; workflow blocks until applied |
| **Recommended** | No errors, but Sanity Studio UX or developer experience degrades noticeably; workflow mentions but does not block |
| **Optional** | Opt-in systems with dedicated architecture; applicable only if project adopts them |

Runtime enforcement reads the `protocols` array from `.stackshift/installed.json`. Each workflow step loads only the protocols whose `id` appears in that array. If the file is absent or the array is missing, enforcement is a no-op.

### Output Files by Step

| Step | Output File(s) |
|------|----------------|
| 1 — Schema fields | `schemas/custom/.../common/fields.ts` |
| 2 — Section schema | `schemas/custom/.../sections/[name]/` |
| 3 — TypeScript types | `types.ts` |
| 4 — Component variant | `components/sections/[name]/` |
| 5 — GROQ query | `pages/api/query.ts` |

---

## Bootstrap

Bootstrap materializes selected protocols and creates project infrastructure under `.stackshift/` to enable protocol customization and extension. It occurs in two phases:

**Phase 1: Materialization (CLI)** — Default behavior (`npx @extragraj/stackshift-skills init`)
- Copies selected protocol files to `.stackshift/protocols/`
- Creates project protocol registry and README
- Creates `design/standards/stackshift-section-variants.md`
- Writes `.forgeignore` defaults (creates if missing; appends if file already exists)
- Sets `.stackshift/installed.json` with `"materializationDone": true`

**Phase 2: UI Forge Integration (AI)** — First invocation
- Runs on all projects (materialized or deferred)
- Detects UI Forge and scans project structure
- Bridges designStandards to `design/design-arch.json`
- Installs PostToolUse hook (if applicable)

With `--no-materialize`, all steps run on first AI invocation instead.

### Bootstrap Install Modes

| Mode | Materialized Content |
|------|---------------------|
| **None** | Nothing. Skill falls back to bundled copies at lookup. |
| **Required** | All `tier: required` protocols only. |
| **Recommended** (default) | All required and recommended protocols. |
| **All** | All registered protocols including optional. |
| **Interactive** | Checkbox prompt with required and recommended pre-selected, optional unchecked. |

### Project Customization Mechanism

After bootstrap completion:
1. **Protocol lookup priority:** `.stackshift/protocols/<id>.md` (project) → `protocols/<id>.md` (skill fallback)
2. Project copies take precedence over bundled skill copies at every lookup
3. Edits persist across skill updates; customizations are never overwritten
4. Deleting a file from `.stackshift/protocols/` falls back to bundled default

---

## Protocols

All 15 registered protocols, organized by tier:

| Protocol | Tier | Applies to | Description |
|----------|------|-----------|-------------|
| Factory Function Pattern | required | Step 1 | Plain-object shape for field factories. Incorrect shape breaks `hideInVariants` at runtime. |
| Sub-Field Visibility | required | Step 1 | Hide sub-fields on the sub-field itself; duplicate field names at section level crash schema load. |
| Variant Router | required | Step 4 | `index.tsx` rules: exported props interface, `null` fallback, `?? undefined` extraction. |
| One-Time Custom Schema Setup | required | Step 2 | Project-level wiring to enable custom sections in Studio. Execute once per project. |
| Field Reuse First | recommended | Step 1 | Verify existing factories before creating new ones. |
| Hide If Variant | recommended | Step 1 | Exclude variants from unused fields via `hideIfVariantIn()`. |
| Preview Conventions | recommended | Step 1 | `preview` block with `prepare()` on array-of-objects and object fields. |
| Array Layout | recommended | Step 1 | `grid` for image arrays, `tags` for string arrays, `collapsible` for nav arrays. |
| Section Directory Layout | recommended | Step 2 | `initialValue/` with placeholder copy and `images/` with variant thumbnails. |
| Accessibility | recommended | Step 4 | WCAG 2.1 AA enforcement via UI Forge's `SIGNAL_A11Y`. Writes `a11yRequired: true` to bootstrap marker. |
| Paired-Mode Contract | recommended | Cross-cutting | Canonical reference for the StackShift ↔ UI Forge handshake: skill-root resolution, marker fields, `_paired` mirror block, flag refusal matrix, modifier composition, contract version handoff. |
| Brand | optional | Step 4 | Registers a project brand document so UI Forge applies voice, palette, typography, and imagery rules via `SIGNAL_BRAND`. |
| Claude Design Handoff | optional | Step 4 | Activates UI Forge's `+CLAUDE_DESIGN` modifier and `--handoff <url>` flag. Permits a Claude Design URL as a layout source (mutually exclusive with HTML/TSX refs). |
| Auto-Verify Hook | optional | Step 4 | Wires UI Forge's `verify.js` single-arg mode as a Claude Code `PostToolUse` hook. Every `.tsx` write triggers automatic contract validation. Claude Code only. |
| Modal & Sheet | optional | Steps 2, 4, 5 | Standalone modal documents linked via `conditionalLink`. Clicking a `linkModal` link opens a `@stackshift-ui/sheet` or `@stackshift-ui/dialog` overlay. |

---

## Customizing Protocols

After bootstrap, protocols can be customized and extended by editing files in `.stackshift/protocols/` and adding custom protocols to the project registry.

### What Can Be Extended

| Area | Location | Customizable? |
|------|----------|---------------|
| **Protocols** | `.stackshift/protocols/` | ✅ Edit materialized protocols; add custom ones via `_registry.json` |
| **References** | `.stackshift/references/` | ✅ Add custom lookup tables for project-specific protocols |
| **Seeds** | `stackshift-core/seeds/` | ❌ Content cannot be overridden at project level |
| **Workflow** | `stackshift-core/workflow/` | ❌ 5-step sequence is fixed |

### Adding a Custom Protocol

**Single-file:** Create `.stackshift/protocols/custom-protocol.md` with frontmatter (id, tier, applies-to), then register in `.stackshift/protocols/_registry.json`:
```json
{
  "protocols": [{
    "id": "custom-protocol",
    "tier": "recommended",
    "file": "custom-protocol.md",
    "title": "Custom Protocol",
    "summary": "Description"
  }]
}
```

**Multi-file:** Copy `.stackshift/protocols/_template/` to a new directory, edit files, and register with `"dir": "custom-protocol/"` instead of `"file"`.

### File Structure After Bootstrap (Recommended mode)

```
your-project/
├── .stackshift/
│   ├── installed.json          # Bootstrap marker (mode, protocols, seed, skillVersion, installedAt, a11yRequired, uiForgeIntegration)
│   ├── protocols/
│   │   ├── _registry.json      # Project protocol registry
│   │   ├── _template/          # Template for multi-file protocols
│   │   ├── factory-function-pattern.md
│   │   ├── sub-field-visibility.md
│   │   ├── variant-router.md
│   │   ├── one-time-custom-schema-setup.md
│   │   ├── field-reuse-first.md
│   │   ├── hide-if-variant.md
│   │   ├── preview-conventions.md
│   │   ├── array-layout.md
│   │   ├── section-directory-layout.md
│   │   ├── accessibility.md
│   │   └── paired-mode-contract.md
│   └── references/             # Custom reference lookups (empty initially)
│       └── README.md
├── .forgeignore                # Scan exclusions
└── design/
    ├── design-arch.json        # UI Forge-owned
    └── standards/
        └── stackshift-section-variants.md
```

Optional protocols (`brand`, `claude-design-handoff`, `auto-verify-hook`, `modal-sheet`) materialize only when the `Full` or `Interactive` install mode selects them.

---

## Seeding Strategies

A seeding strategy is a reusable instruction set that guides the AI in populating or scaffolding a specific aspect of a StackShift project. The active strategy is recorded in `.stackshift/installed.json` → `seed`. **Only one strategy may be active at a time.**

| Strategy | ID | Applies to | Description |
|----------|----|-----------|-------------|
| **Initial-Value Seeding** | `initialvalue-seeding` | Step 2 — `initialValue/` | Extracts content from an HTML mockup or hardcoded component and maps it to schema fields, writing realistic placeholder copy for Sanity Studio authors. |

**Activate:**
```bash
npx @extragraj/stackshift-skills init --seed initialvalue-seeding --no-interactive
```

**Deactivate:**
```bash
npx @extragraj/stackshift-skills init --seed none --no-interactive
```

---

## Companion Skill

During component variant creation, StackShift delegates to `ui-forge` once schema, types, and section wiring are complete. At handoff, StackShift has created an empty variant file, registered the dynamic import in `index.tsx`, and exported the props interface. `ui-forge` receives the props interface as its contract and generates the complete variant component body.

**Interface Boundary:** StackShift never authors component code. `ui-forge` never modifies schema or wiring. The props interface defines the boundary.

### Shared State

| File | Owner | StackShift writes | UI Forge writes |
|------|-------|-------------------|-----------------|
| `.stackshift/installed.json` | StackShift | `mode`, `protocols`, `seed`, `a11yRequired`, `uiForgeIntegration` | reads only |
| `design/design-arch.json` | UI Forge | `designStandards.*` pointers, optional `_paired` mirror | tokens, patterns, components |
| `.claude/settings.json` | shared | `PostToolUse` hook entry (when `auto-verify-hook` active) | none |

The `paired-mode-contract` protocol (recommended tier) is the single canonical reference for skill-root resolution, marker fields, the flag refusal matrix, modifier composition, and contract version handoff.

---

## Repository Structure

```
stackshift-workflow-skills/
├── skill.version                 # Single source of truth for versioning
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── package.json                  # Root package (@extragraj/stackshift-skills)
├── CLAUDE.md                     # Project instructions for AI coding tools
├── bin/
│   └── cli.mjs                   # Published CLI entry point
├── scripts/
│   └── sync-version.mjs          # Syncs skill.version to package.json, cli/package.json, README.md
├── skills/
│   ├── stackshift-core/          # Main skill: SKILL.md, workflow/, protocols/, references/, seeds/, bootstrap/
│   ├── stackshift-protocols-required/    # Index: 4 required protocols
│   ├── stackshift-protocols-recommended/ # Index: 4 required + 7 recommended
│   ├── stackshift-protocols-full/        # Index: all tiers
│   └── stackshift-seed-initialvalue/     # Discoverable stub → points to stackshift-core/seeds/
├── cli/                          # Interactive installer (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/                      # index.ts, install.ts, repair.ts, registry.ts, prompts.ts, flags.ts, writer.ts
└── change-logs/                  # Release notes
```

**Architecture Notes:**
- `stackshift-core` contains all protocols, workflow steps, references, and canonical seed content
- Protocol tier bundles contain only `SKILL.md` index files
- Seed skill folders contain only a `SKILL.md` reference stub; canonical content stays in `stackshift-core`
- CLI is a separate workspace package (`cli/`) built with TypeScript

---

## Version Compatibility

| Dependency | Version |
|------------|---------|
| Sanity | v3.17 |
| Next.js | 14, Pages Router |
| TypeScript | strict mode |
| `@webriq-pagebuilder/sanity-plugin-schema-default` | extend, do not replace |
| `@stackshift-ui/*` | component library, referenced in `index.tsx` only |
| `ui-forge` (companion skill) | ≥0.1.9 for `paired-mode-contract`, `claude-design-handoff`, `auto-verify-hook`; ≥0.1.8 baseline |

For complete compatibility matrix including peer dependencies, see `references/versions.md` in the skill.

---

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 9 or higher (`npm install -g pnpm` or `corepack enable pnpm`)

### Quick Start

```bash
git clone https://github.com/extragraj/stackshift-workflow-skills
cd stackshift-workflow-skills
pnpm install
pnpm build
npx . init
```

### Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| **install** | `pnpm install` | Install dependencies for root and cli workspace |
| **build** | `pnpm build` | Build CLI (`pnpm --filter stackshift-cli build`) |
| **sync-version** | `pnpm sync-version` | Sync `skill.version` to `package.json`, `cli/package.json`, `README.md` |
| **prepack** | `pnpm prepack` | Auto-executes before `pnpm publish` (syncs version + builds CLI) |
| **dev** (CLI) | `cd cli && pnpm dev` | Execute CLI in development mode via `tsx` (no build step) |

### Common Workflows

```bash
# CLI development
pnpm install && pnpm build && npx . init

# Quick iteration (no build)
cd cli && pnpm dev

# Protocol/skill changes (no build needed for Markdown)
vim skills/stackshift-core/protocols/new-protocol.md

# Version & publish
echo "0.2.6" > skill.version && pnpm sync-version && pnpm publish
```

### Published Package Contents

```
@extragraj/stackshift-skills/
├── bin/cli.mjs           # CLI entry point
├── cli/dist/             # Built JavaScript
├── skills/               # All skill packages
└── skill.version         # Version file