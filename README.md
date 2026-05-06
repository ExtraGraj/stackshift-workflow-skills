# StackShift Skill

> **Version** 0.2.3 | **Sanity** v3.17 | **Next.js** 14 Pages Router | **TypeScript** Strict

A structured agentic skill for building sections and variants inside StackShift, a composable Sanity v3 and Next.js page-builder. Enforces a strict 5-step implementation workflow, governs quality through a tiered protocol system, supports seed strategies, and delegates component rendering to the `ui-forge` companion skill.

---

## Installation

Two installation methods are available: **`npx skills add`** for quick direct installs, or the **interactive CLI** for guided tier selection and multi-platform support. The `stackshift-core` package is required in all cases.

### Platform Overview

| Platform | Project skill root | Global skill root |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| GitHub Copilot (Agent Mode) | `.github/skills/` | `~/.copilot/skills/` |
| OpenAI Codex / Universal Agents | `.agents/skills/` | `~/.agents/skills/` |
| Google Gemini (Antigravity) | `.agents/skills/` | `~/.gemini/antigravity/skills/` |
| Cursor IDE | `.cursor/skills/` | `~/.cursor/skills/` |

---

### Option A — npx skills add

Install skill packages directly using `npx skills add`. Specify `-a` to target the platform.

```bash
# Universal agents (.agents/skills/) — global
npx skills add extragraj/stackshift-workflow-skills -g -a agents

# Universal agents (.agents/skills/) — project only
npx skills add extragraj/stackshift-workflow-skills -a agents

# Claude Code (.claude/skills/) — global
npx skills add extragraj/stackshift-workflow-skills -g -a claude-code

# Claude Code (.claude/skills/) — project only
npx skills add extragraj/stackshift-workflow-skills -a claude-code
```

#### Command Flags

| Flag | Description |
|------|-------------|
| `-g` | Install globally (available across all projects) |
| `-a agents` | Install to `.agents/skills/` (universal — all general agents) |
| `-a claude-code` | Install to `.claude/skills/` (Claude Code) |

#### Important Installation Guidelines

**When using `npx skills add`, you MUST:**

1. **Always install `stackshift-core`** - This is required for the workflow system
2. **Install only ONE protocol tier bundle** - Select either:
   - `stackshift-protocols-required` (required protocols only)
   - `stackshift-protocols-recommended` (required + recommended protocols)
   - `stackshift-protocols-full` (all protocols)
3. **Install only ONE seeding strategy (optional)** - Seeding strategies are discoverable as `stackshift-seed-*` packages. Install at most one. If you accidentally install multiple, run `npx @extragraj/stackshift-skills repair`. Run `npx @extragraj/stackshift-skills init` to activate your chosen seed in `.stackshift/installed.json`.

**Do NOT select multiple protocol tier bundles** (e.g., both `required` and `full`). Each tier is cumulative and includes all lower tiers, so installing multiple bundles is redundant and will cause installation conflicts.

#### Protocol Tier Comparison

| Skill Package | Protocols Included | Use Case |
|---------------|-------------------|----------|
| `stackshift-protocols-required` | 4 required protocols | Minimal installation |
| `stackshift-protocols-recommended` | 4 required + 6 recommended (default) | **Recommended for most users** |
| `stackshift-protocols-full` | All tiers (required + recommended + optional) | Complete protocol coverage |

#### Fixing Multi-Tier or Multi-Seed Installations

If you accidentally installed multiple protocol tier bundles or multiple seeding strategies, run:

```bash
npx @extragraj/stackshift-skills repair
```

This will scan for multiple protocol bundles and seed folders and help you keep only one of each.

---

### Option B — Interactive CLI (Recommended)

An interactive command-line interface that handles tier selection, platform selection (supports multiple), install scope, and bootstrap marker creation in a single guided flow. **This is the recommended installation method** as it prevents multi-tier conflicts and provides proper tier management.

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

# Non-interactive with materialization (default, runs CLI + AI phases)
npx @extragraj/stackshift-skills init --tier recommended --materialize --no-interactive
```

**Available Flags:**

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--tier` | `required`, `recommended`, `full` | `recommended` | Protocol tier to install |
| `--scope` | `project`, `global` | `project` | Install location |
| `--platform` | `agents`, `claude`, `copilot`, `gemini`, `cursor`, or comma-separated | `agents` | Platform(s) to install to |
| `--seed` | seed id or `none` | `none` | Seeding strategy to activate (e.g. `initialvalue-seeding`) |
| `--materialize` | (flag) | `true` (default) | Materialize protocols after install (CLI phase). Copies protocols to `.stackshift/protocols/`, creates references and design standards. UI Forge integration steps run on first AI agent invocation. |
| `--no-materialize` | (flag) | `false` | Skip CLI materialization; defer all steps to AI agent on first invocation. |
| `--no-interactive` | (flag) | `false` | Skip prompts, use flags + defaults |
| `--help` | (flag) | - | Show help text |


**Note:** Custom tier selection requires interactive mode (not supported with `--no-interactive`).

#### Protocol Replacement Warning

If a protocol tier is already installed and `init` runs again, the CLI detects the existing installation and prompts:

```
? Protocol tier "recommended" is already installed.
  Replace with a different tier? (y/N)
```

For custom tier selections, the prompt defaults to `Yes`:

```
? A custom protocol selection is already installed.
  Replace with a pre-built tier? (Y/n)
```

Answering **No** does not cancel the session — it keeps the existing protocol tier and continues to the seed strategy, scope, and platform prompts. This lets you update only your seed selection without reinstalling protocols.

#### Multi-Platform Tier Detection

If different tiers are installed across platforms (e.g., `required` in `.agents/` and `full` in `.claude/`), the CLI warns:

```
┌  Warning
│
│  Different tiers detected:
│    .agents: required
│    .claude: full
│
│  This installation will replace BOTH.
│
└
```

#### Repair Command

If you encounter multi-tier or multi-seed installation issues (e.g., from using `npx skills add`), use the repair command:

```bash
npx @extragraj/stackshift-skills repair
```

This scans for multiple protocol bundles and seed folders, helps you keep only one of each, and syncs `.stackshift/installed.json` to match.

---

### Installation Process

After installing via Option A or B:

1. **Skills are installed** to chosen location(s) and platform(s):
   - `stackshift-core` (always included - workflow, protocols, references)
   - One protocol tier bundle (required, recommended, or full)
   - **Option A:** To `.agents/skills/` or `.claude/skills/` based on `-a` flag
   - **Option B:** To selected platform(s) from interactive prompt or `--platform` flag

2. **Physical cleanup** (Option B only):
   - Old protocol bundle folders are automatically removed
   - Prevents multi-tier conflicts
   - Updates lock files across all platforms

3. **Bootstrap marker** (`.stackshift/installed.json`) is written (project scope only)
   - **Default (materialization enabled):** marker includes `"materializationDone": true` — CLI materializes protocols; AI agent completes UI Forge integration
   - **With `--no-materialize`:** marker includes `"bootstrapRequired": true` — AI agent runs full interactive bootstrap on first invocation

4. **AI agent validation** on first invocation:
   - Checks for multiple protocol bundles (Option A safety check)
   - Validates `stackshift-core` presence
   - If issues found, suggests running `npx @extragraj/stackshift-skills repair`

5. **Bootstrap runs** when `bootstrapRequired: true` or `materializationDone` is not set:
   - **Default:** CLI materializes protocols (Steps 5 & 8); AI agent completes UI Forge integration (Steps 6, 7b)
   - **With `--no-materialize`:** AI agent runs full bootstrap (all steps) on first invocation

#### Installation Method Comparison

| Feature | Option A (`npx skills add`) | Option B (interactive CLI) |
|---------|----------------------------|---------------------------|
| **Tier enforcement** | Manual | Automatic |
| **Core installation** | Manual | Automatic |
| **Seed activation** | Manual (`npx init` after) | Automatic (guided prompt) |
| **Physical cleanup** | No | Yes (protocol bundles only) |
| **Multi-tier prevention** | No | Yes |
| **Multi-seed prevention** | No (use `repair`) | Yes |
| **Automation support** | Limited | Full (`--no-interactive`) |
| **Platforms supported** | `agents`, `claude` | `agents`, `claude`, `copilot`, `gemini`, `cursor` |
| **Bootstrap materialization** | No (agent only) | Default (use `--no-materialize` to defer) |

**Note:** The `ui-forge` companion skill must be installed independently; StackShift bootstrap will detect and integrate it automatically when present.

---

## How the Skill Operates

StackShift sections follow a predictable anatomy: a Sanity schema defining fields, a TypeScript interface describing data shape, React variant components for rendering, and a GROQ query for data fetching. Every section, whether new or extended, progresses through five implementation steps in strict order:

```
1. Schema fields → 2. Section schema → 3. TypeScript types → 4. Component variant → 5. GROQ query
```

Each step produces output required by the subsequent step. The skill enforces this sequence without exception, as reordering introduces broken imports, type errors, and mismatched GROQ projections.

### Lookup-Table Architecture

The skill uses a lookup-table structure to keep context focused:

- **Core router** (`SKILL.md`) contains the workflow table, a topic-to-file lookup table, and hard rules
- **Workflow steps** are stored in individual files; the router table directs the agent to load only the relevant step
- **Protocols** are discovered via merged registries and loaded on demand when a step or error references them
- **References** (field factories, GROQ fragments, type catalogs) are accessed through the lookup table in Section 3

Step ordering is enforced by instruction: the agent executes only the step that matches the current context and does not advance until it is complete.

### Protocol System

A tiered protocol system codifies team conventions and enables individual loading. Protocols are tiered by impact to guide AI decision-making:

| Tier | Effect if Skipped |
|------|-------------------|
| **Required** | Build errors, runtime errors, or schema load failures; workflow blocks until applied |
| **Recommended** | No errors, but Sanity Studio UX or developer experience degrades noticeably; workflow mentions but does not block |
| **Optional** | Opt-in systems with dedicated architecture; applicable only if project adopts them |

### Output Files by Step

| Step | Output File(s) |
|------|----------------|
| 1 — Schema fields | `schemas/custom/.../common/fields.ts` |
| 2 — Section schema | `schemas/custom/.../sections/[name]/` |
| 3 — TypeScript types | `types.ts` |
| 4 — Component variant | `components/sections/[name]/` |
| 5 — GROQ query | `pages/api/query.ts` |

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
| Claude Design Handoff | optional | Step 4 | Activates UI Forge's `+CLAUDE_DESIGN` modifier and `--handoff <url>` flag. Permits a Claude Design URL as a layout source (mutually exclusive with HTML/TSX refs). Bootstrap can seed Claude Design via `/forge-export-design`. |
| Auto-Verify Hook | optional | Step 4 | Wires UI Forge's `verify.js` single-arg mode as a Claude Code `PostToolUse` hook. Every `.tsx` write triggers automatic contract validation. Claude Code only — no-op on other agents. |
| Modal & Sheet | optional | Steps 2, 4, 5 | Standalone modal documents linked via `conditionalLink`. Clicking a `linkModal` link opens a `@stackshift-ui/sheet` or `@stackshift-ui/dialog` overlay. Split into one-time setup and per-variant workflow with UI Forge delegation. |

---

## Seeding Strategies

A seeding strategy is a reusable instruction set that guides the AI in populating or scaffolding a specific aspect of a StackShift project. Strategies are scoped to particular workflow steps and output areas.

The active strategy is recorded in `.stackshift/installed.json` → `seed`. When the AI reaches a step that writes files covered by the active strategy, it checks for the `seed` field and loads the strategy as a **required gate** before writing — no verbal instruction needed. **Only one strategy may be active at a time.** Running `init` again replaces it; running `repair` resolves accidental multi-seed installs.

### Available Seed Strategies

| Strategy | ID | Applies to | Description |
|----------|----|-----------|-------------|
| **Initial-Value Seeding** | `initialvalue-seeding` | Step 2 — `initialValue/` | Extracts content from an HTML mockup or hardcoded component and maps it to the corresponding schema fields, writing realistic placeholder copy for Sanity Studio authors. |

### Activating a Seed

**Interactive (recommended):**
```bash
npx @extragraj/stackshift-skills init
# → prompted after protocol tier selection
```

**Non-interactive:**
```bash
npx @extragraj/stackshift-skills init --seed initialvalue-seeding --no-interactive
```

**Deactivate:**
```bash
npx @extragraj/stackshift-skills init --seed none --no-interactive
# or select "None (skip)" during interactive init
```

### Seed Discovery

`stackshift-seed-*` packages are discoverable via `npx skills add` (Vercel). They are reference stubs — all strategy content lives in `stackshift-core/seeds/`. Installing a stub folder does not activate the seed; activation requires recording the selection in `installed.json` via `init`.

---

## Bootstrap

Bootstrap materializes selected protocols and creates project infrastructure under `.stackshift/` to enable protocol customization and extension. It occurs in two phases:

**Phase 1: Materialization (CLI)** — Default behavior (`npx stackshift init`)
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

When UI Forge is detected, bootstrap also wires up the StackShift ↔ UI Forge handshake:

- **Step 6c** — resolves `${UI_FORGE_SKILL_DIR}` (prefers UI Forge's `scripts/detect.sh` ≥ 0.1.9; falls back to a 7-entry path lookup), runs `scan.js` if `design/design-arch.json` is missing, and surfaces UI Forge 0.1.9C's scan-fallback banner. Optionally appends `--schema-v4` for dark-mode token extraction.
- **Step 6g** (conditional) — when the `claude-design-handoff` protocol is materialized, offers to run `/forge-export-design` to seed Claude Design with project tokens.
- **Step 6h** — once `design/design-arch.json` exists, writes a `_paired` mirror block so UI Forge can read StackShift markers from one surface. `.stackshift/installed.json` remains the canonical write target.
- **Step 7b** (conditional) — when the `auto-verify-hook` protocol is materialized and Claude Code runtime is detected, idempotently merges a `PostToolUse` hook entry into `.claude/settings.json`.
- **Step 8** — `.forgeignore` defaults include `design/.handoff-cache/` and `design/claude-design-bundle/` so UI Forge never walks regeneratable artifacts. If `.forgeignore` already exists, StackShift appends its defaults while preserving existing user-authored entries. (See [0.2.3A release notes](change-logs/0.2.3A-forgeignore-append.md).)

### Bootstrap Execution Timing

**Installation via Option A (npx skills add):**
- Bootstrap runs on first AI invocation (no marker file present)
- AI prompts for install mode interactively

**Installation via Option B (npx stackshift init):**
- CLI pre-writes `.stackshift/installed.json` marker with selected tier
- Bootstrap executes on first AI invocation using recorded selection (no prompts)
- Applies to project scope installations only; global installations omit the marker

### Bootstrap Install Modes

| Mode | Materialized Content |
|------|---------------------|
| **None** | Nothing. Skill falls back to bundled copies at lookup. |
| **Required** | All `tier: required` protocols only. Minimal customizable surface. |
| **Recommended** (default) | All required and recommended protocols. Standard baseline. |
| **All** | All registered protocols including optional. |
| **Interactive** | Checkbox prompt with required and recommended pre-selected, optional unchecked. |

### Project Customization Mechanism

After bootstrap completion:

1. **Protocol lookup priority:**
   ```
   .stackshift/protocols/<id>.md (project) → protocols/<id>.md (skill fallback)
   .stackshift/protocols/<id>/ (project)   → protocols/<id>/ (skill fallback)
   ```

2. Project copies take precedence over bundled skill copies at every lookup
3. Edits persist across skill updates; customizations are never overwritten
4. Deleting a file from `.stackshift/protocols/` falls back to bundled default

This design enables teams to version protocols alongside their codebase while benefiting from skill updates to workflow and references.

---

## Customizing Protocols

After bootstrap, protocols can be customized and extended by editing files in `.stackshift/protocols/` and adding custom protocols to the project registry.

### What Can Be Extended

**Protocols** (`.stackshift/protocols/`)
- Edit materialized protocols from bootstrap (project copy takes precedence at lookup)
- Add custom project-specific protocols
- Register custom protocols in `.stackshift/protocols/_registry.json`
- Custom protocols are discovered from the project registry

**References** (`.stackshift/references/`)
- Add custom reference lookups for project-specific protocols
- Augment skill references with project-specific data
- Empty by default; add as needed

**Seeds** (Not Customizable)
- Seeding strategies live in `stackshift-core/seeds/`; their content cannot be overridden at the project level
- Activate a seed via `npx @extragraj/stackshift-skills init` or `--seed <id>` flag
- Only ONE seed may be active at a time (recorded in `.stackshift/installed.json` → `seed`)
- Available seeds: **Initial-Value Seeding** (`initialvalue-seeding`) — extracts copy from HTML mockups and hardcoded components into `initialValue/index.ts`

**Workflow** (Not Customizable)
- Workflow steps remain in skill (`stackshift-core/workflow/`)
- Defines the 5-step sequence and cannot be modified
- Custom protocols integrate into existing workflow steps

### File Structure After Bootstrap

After bootstrap with "Recommended" mode:

```
your-project/
├── .stackshift/
│   ├── installed.json          # Bootstrap marker (mode, protocols, seed, skillVersion, installedAt, a11yRequired, uiForgeIntegration)
│   ├── protocol/
│   │   ├── _registry.json      # Project protocol registry (custom protocols)
│   │   ├── _template/          # Template for complex multi-file protocols
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
│   │
│   └── references/             # Custom reference lookups (empty initially)
│       └── README.md
│
├── .forgeignore                # Sanity + Next.js scan exclusions (incl. design/.handoff-cache/, design/claude-design-bundle/)
├── .claude/
│   └── settings.json           # PostToolUse hook entry (only when auto-verify-hook protocol is active)
│
└── design/
    ├── design-arch.json        # UI Forge-owned; StackShift writes designStandards.* + optional _paired mirror block
    └── standards/
        └── stackshift-section-variants.md   # StackShift section variant conventions for UI Forge
```

**Optional protocols** (`brand`, `claude-design-handoff`, `auto-verify-hook`) materialize to `.stackshift/protocols/` only when the `Full` or `Interactive` install mode selects them.

### Adding Custom Protocols

#### Simple Single-File Protocol

1. Create `.stackshift/protocols/custom-image-sizing.md`:
   ```markdown
   # Custom Image Sizing Protocol

   **Tier:** recommended
   **Applies to:** Step 1 (Schema fields)

   ## Description
   All image fields must specify explicit width/height constraints...

   ## Implementation
   [Your convention details]
   ```

2. Register in `.stackshift/protocols/_registry.json`:
   ```json
   {
     "protocols": [
       {
         "id": "custom-image-sizing",
         "tier": "recommended",
         "file": "custom-image-sizing.md",
         "title": "Custom Image Sizing",
         "summary": "Enforces width/height constraints on image fields"
       }
     ]
   }
   ```

3. Protocol discovered and loads when workflow reaches Step 1

#### Complex Multi-File Protocol

For protocols requiring multiple files, examples, or sub-documentation:

1. Copy template: `cp -r .stackshift/protocols/_template/ .stackshift/protocols/custom-protocol/`

2. Edit files in `.stackshift/protocols/custom-protocol/`:
   - `overview.md` - Main entry point
   - `architecture.md` - Architecture decisions
   - `checklist.md` - Done-when criteria
   - Add additional files as needed

3. Register in `.stackshift/protocols/_registry.json`:
   ```json
   {
     "protocols": [
       {
         "id": "custom-protocol",
         "tier": "optional",
         "dir": "custom-protocol/",
         "title": "Custom Protocol Name",
         "summary": "What this protocol governs"
       }
     ]
   }
   ```

### Adding Custom References

For custom protocols that need lookup tables:

1. Create `.stackshift/references/custom-lookups.md`:
   ```markdown
   # Custom Lookups

   Reference data for custom protocols.

   ## Custom Image Sizes
   - thumbnail: 150x150
   - card: 400x300
   - hero: 1200x600
   ```

2. Reference from your custom protocol:
   ```markdown
   See `.stackshift/references/custom-lookups.md` for standard image sizes.
   ```

Custom references augment skill references without modifying them.

---

## Repository Structure

```
stackshift-workflow-skills/
│
├── skill.version                 # Single source of truth for versioning
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── package.json                  # Root package (@extragraj/stackshift-skills)
├── pnpm-lock.yaml                # Dependency lock file (pnpm only)
├── CLAUDE.md                     # Project instructions for AI coding tools
│
├── bin/
│   └── cli.mjs                   # Published CLI entry point (npx stackshift)
│
├── scripts/
│   └── sync-version.mjs          # Syncs skill.version to package.json, cli/package.json, README.md
│
├── skills/
│   ├── stackshift-core/
│   │   ├── SKILL.md              # Main router: workflow table, lookup table, hard rules
│   │   ├── _registry.schema.json # Shared JSON schema for protocol/seed registries
│   │   ├── workflow/             # 5 step files and checklist (loaded on demand)
│   │   ├── protocols/            # 15 protocols (14 single-file + 1 dir) and _registry.json
│   │   ├── references/           # Lookup tables (field factories, GROQ, types, versions, claude-design-roundtrip)
│   │   ├── seeds/                # Canonical seed strategy content + _registry.json
│   │   └── bootstrap/            # First-run install flow and modes
│   │
│   ├── stackshift-protocols-required/
│   │   └── SKILL.md              # Index: 4 required protocols
│   │
│   ├── stackshift-protocols-recommended/
│   │   └── SKILL.md              # Index: 4 required + 5 recommended
│   │
│   ├── stackshift-protocols-full/
│   │   └── SKILL.md              # Index: all tiers
│   │
│   └── stackshift-seed-initialvalue/
│       └── SKILL.md              # Discoverable stub → points to stackshift-core/seeds/
│
└── cli/                          # Interactive installer (npx @extragraj/stackshift-skills init)
    ├── package.json              # CLI package (stackshift-cli)
    ├── tsconfig.json
    └── src/
        ├── index.ts              # Command router
        ├── install.ts            # Orchestrates init flow
        ├── repair.ts             # Orchestrates repair flow
        ├── registry.ts           # Loads skills via gray-matter
        ├── prompts.ts            # Interactive prompts (@clack/prompts)
        ├── flags.ts              # CLI flag parsing (--tier, --scope, etc.)
        └── writer.ts             # Copies skills, writes lock file and bootstrap marker
```

**Architecture Notes:**
- `stackshift-core` contains all protocols, workflow steps, references, and canonical seed content
- Protocol tier bundles (`required/recommended/full`) contain only `SKILL.md` index files
- Seed skill folders (`stackshift-seed-*`) contain only a `SKILL.md` reference stub pointing to `stackshift-core/seeds/`; canonical content stays in `stackshift-core`
- CLI is a separate workspace package (`cli/`) built with TypeScript
- Version sync script maintains consistency across `skill.version`, `package.json`, `cli/package.json`, and `README.md`

---

## Companion Skill

During component variant creation, StackShift delegates to `ui-forge` once schema, types, and section wiring are complete. At handoff, StackShift has:

- Created an empty variant file
- Registered the dynamic import in `index.tsx`
- Exported the props interface

`ui-forge` receives the props interface as its contract and generates the complete variant component body.

**Interface Boundary:** StackShift never authors component code. `ui-forge` never modifies schema or wiring. The props interface defines the boundary.

### Shared State

The two skills coordinate through three files (full ownership matrix in `protocols/paired-mode-contract.md`):

| File | Owner | StackShift writes | UI Forge writes |
|------|-------|-------------------|-----------------|
| `.stackshift/installed.json` | StackShift | `mode`, `protocols`, `seed`, `a11yRequired`, `uiForgeIntegration` | reads only |
| `design/design-arch.json` | UI Forge | `designStandards.*` pointers, optional `_paired` mirror | tokens, patterns, components |
| `.claude/settings.json` | shared | `PostToolUse` hook entry (when `auto-verify-hook` active) | none |

The `paired-mode-contract` protocol (recommended tier) is the single canonical reference for skill-root resolution, marker fields, the flag refusal matrix (`--creative` / `--diff` / `--preview`), modifier composition, and the contract version handoff.

### Optional Paired Protocols

- **`claude-design-handoff`** — enables `/forge --handoff <url>` to use a Claude Design URL as a layout source. Round-trip workflow documented in `references/claude-design-roundtrip.md`.
- **`auto-verify-hook`** — wires UI Forge's `verify.js` as a Claude Code `PostToolUse` hook so every `.tsx` write auto-validates against its contract.

---

## Version Compatibility

| Dependency | Version |
|------------|---------|
| Sanity | v3.17 |
| Next.js | 14, Pages Router |
| TypeScript | strict mode |
| `@webriq-pagebuilder/sanity-plugin-schema-default` | extend, do not replace |
| `@stackshift-ui/*` | component library, referenced in `index.tsx` only |
| `ui-forge` (companion skill) | ≥0.1.9 for `paired-mode-contract`, `claude-design-handoff`, `auto-verify-hook`; ≥0.1.8 baseline (see `references/versions.md`) |

For complete compatibility matrix including peer dependencies, see `references/versions.md` in the skill.

---

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 9 or higher (install via `npm install -g pnpm` or `corepack enable pnpm`)

### Quick Start

```bash
# Clone and setup
git clone https://github.com/extragraj/stackshift-workflow-skills
cd stackshift-workflow-skills
pnpm install

# Build CLI
pnpm build

# Test locally
npx . init
```

For detailed workflow examples and script reference, see [Scripts Reference](#scripts-reference) below.

---

## Scripts Reference

This monorepo contains scripts at two levels: root (project scope) and cli (workspace package). The following tables document each script's purpose and usage.

### Root Scripts (Project Scope)

Execute these from `/stackshift-workflow-skills/` (repository root):

| Script | Command | Description | Usage Context |
|--------|---------|-------------|---------------|
| **install** | `pnpm install` | Installs dependencies for root and cli workspace | After cloning, after pulling dependency changes |
| **build** | `pnpm build` | Builds the CLI (executes `pnpm --filter stackshift-cli build`) | After modifying TypeScript files in `cli/src/` |
| **sync-version** | `pnpm sync-version` | Syncs `skill.version` to `package.json`, `cli/package.json`, `README.md` | After editing `skill.version` file |
| **prepack** | `pnpm prepack` | Auto-executes before `pnpm publish` (syncs version and builds CLI) | Triggered automatically; do not execute manually |

### CLI Scripts (Workspace Package)

Execute these from `/stackshift-workflow-skills/cli/` (workspace directory):

| Script | Command | Description | Usage Context |
|--------|---------|-------------|---------------|
| **build** | `pnpm build` | Compiles TypeScript (`src/`) to JavaScript (`dist/`) via `tsc` | After modifying TypeScript source files |
| **dev** | `pnpm dev` | Executes CLI in development mode via `tsx` (no build step) | Quick testing during development |

**Note:** CLI scripts can be executed from root using `pnpm --filter stackshift-cli <script>`, but prefer root scripts for common operations.

### Common Workflows

**CLI Development:**
```bash
pnpm install              # Setup (once)
vim cli/src/prompts.ts    # Modify TypeScript
pnpm build                # Build
npx . init                # Test locally
```

**Quick Iteration (no build):**
```bash
cd cli && pnpm dev        # Uses tsx to execute TypeScript directly
```

**Protocol/Skill Changes:**
```bash
vim skills/stackshift-core/protocols/new-protocol.md   # Edit skill files
# No build needed for Markdown files
```

**Version & Publish:**
```bash
echo "0.2.1" > skill.version
pnpm sync-version         # Syncs version across package.json files
pnpm publish              # Builds and publishes (prepack hook runs automatically)
```

**Adding a new seed strategy:**
```bash
# 1. Create canonical content
vim skills/stackshift-core/seeds/my-strategy.md
# 2. Create discoverable stub
mkdir skills/stackshift-seed-mystrategy
vim skills/stackshift-seed-mystrategy/SKILL.md
# 3. Register in seeds/_registry.json
# 4. Build and test
pnpm build && node -e "const { loadSeedRegistry } = await import('./cli/dist/registry.js'); console.log(loadSeedRegistry())"
```

### Published Package Contents

Executing `pnpm publish` includes:

```
@extragraj/stackshift-skills/
├── bin/cli.mjs           # CLI entry point
├── cli/dist/             # Built JavaScript (from cli/src/)
├── skills/               # All skill packages (stackshift-core, protocol bundles)
└── skill.version         # Version file
```

The `"files"` field in root `package.json` controls published content. Source TypeScript (`cli/src/`) is excluded.
