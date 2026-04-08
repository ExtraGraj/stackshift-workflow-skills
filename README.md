# StackShift Skill

> **Version** 0.1.5 | **Sanity** v3.17 | **Next.js** 14 Pages Router | **TypeScript** Strict

A structured agentic skill for building sections and variants inside StackShift, a composable Sanity v3 and Next.js page-builder. Enforces a strict 5-step implementation workflow, governs quality through a tiered protocol system, and delegates component rendering to the `ui-forge` companion skill.

---

## Installation

Two installation methods are available: **manual installation** via `npx skills add`, or **guided installation** via the interactive CLI. Both methods install to `.agents/skills/` or `.claude/skills/` depending on platform preference. The `stackshift-core` package is required in all cases.

### Option A — Manual Installation

Install skill packages individually using the `npx skills add` command.

```bash
# Install globally (available across all projects)
npx skills add extragraj/stackshift-workflow-skills -g -a claude-code

# Install to current project only
npx skills add extragraj/stackshift-workflow-skills -a claude-code
```

#### Command Flags

| Flag | Description |
|------|-------------|
| `-g` | Install globally (available across all projects) |
| `-a claude-code` | Install to `.claude/skills/` (Claude Code) |

#### Important Installation Guidelines

**When using `npx skills add`, you MUST:**

1. **Always install `stackshift-core`** - This is required for the workflow system
2. **Install only ONE protocol tier bundle** - Select either:
   - `stackshift-protocols-required` (4 required protocols only)
   - `stackshift-protocols-recommended` (4 required + 5 recommended) ← **Recommended**
   - `stackshift-protocols-full` (all tiers)

**Do NOT select multiple protocol tier bundles** (e.g., both `required` and `full`). Each tier is cumulative and includes all lower tiers, so installing multiple bundles is redundant and will cause installation conflicts.

#### Protocol Tier Comparison

| Skill Package | Protocols Included | Use Case |
|---------------|-------------------|----------|
| `stackshift-protocols-required` | 4 required protocols only | Minimal installation |
| `stackshift-protocols-recommended` | 4 required + 5 recommended (default) | **Recommended for most users** |
| `stackshift-protocols-full` | All tiers (required + recommended + optional) | Complete protocol coverage |

#### Fixing Multi-Tier Installations

If you accidentally installed multiple protocol tier bundles, run:

```bash
npx @extragraj/stackshift-skills repair
```

This will scan for multiple bundles and help you keep only one.

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

# Run locally from this repository
npx . init
```

**Available Flags:**

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--tier` | `required`, `recommended`, `full` | `recommended` | Protocol tier to install |
| `--scope` | `project`, `global` | `project` | Install location |
| `--platform` | `agents`, `claude`, `agents,claude` | `agents` | Platform(s) to install to |
| `--no-interactive` | (flag) | `false` | Skip prompts, use flags + defaults |
| `--help` | (flag) | - | Show help text |


**Note:** Custom tier selection requires interactive mode (not supported with `--no-interactive`).

#### Protocol Replacement Warning

If a protocol tier is already installed and `init` runs again, the CLI detects the existing installation and prompts:

```
? Protocol tier already installed: recommended
  Replace with a different tier? (y/N)
```

For custom tier selections, the prompt defaults to `Yes`:

```
? Custom protocol selection detected.
  Replace with a pre-built tier? (Y/n)
```

This prevents accidental tier replacement and ensures the change is intentional.

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

If you encounter multi-tier installation issues (e.g., from using `npx skills add`), use the repair command:

```bash
npx @extragraj/stackshift-skills repair
```

This scans for multiple protocol bundles and helps you keep only one.

---

### Installation Process

After installing via either Option A or Option B:

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

4. **AI agent validation** on first invocation:
   - Checks for multiple protocol bundles (Option A safety check)
   - Validates `stackshift-core` presence
   - If issues found, suggests running `npx @extragraj/stackshift-skills repair`

5. **Bootstrap runs** on first AI invocation (after validation passes):
   - **Project scope:** Uses recorded tier selection, materializes protocols to `/docs/` (no prompts)
   - **Global scope:** Prompts for install mode in each new project, then materializes protocols

#### Installation Method Comparison

| Feature | Option A (`npx skills add`) | Option B (`npx @extragraj/stackshift-skills init`) |
|---------|----------------------------|---------------------------------------------------|
| **Tier enforcement** | Manual (user must select correctly) | Automatic (radio buttons, only one selectable) |
| **Core installation** | Manual (must remember to select) | Automatic (always included) |
| **Physical cleanup** | No (old folders remain) | Yes (automatic removal) |
| **Multi-tier prevention** | No (requires repair after) | Yes (prevents during install) |
| **Automation support** | Limited | Full (with `--no-interactive` flag) |

**Note:** The `ui-forge` companion skill must be installed independently regardless of which installation option is chosen.

---

## How the Skill Operates

StackShift sections follow a predictable anatomy: a Sanity schema defining fields, a TypeScript interface describing data shape, React variant components for rendering, and a GROQ query for data fetching. Every section, whether new or extended, progresses through five implementation steps in strict order:

```
1. Schema fields → 2. Section schema → 3. TypeScript types → 4. Component variant → 5. GROQ query
```

Each step produces output required by the subsequent step. The skill enforces this sequence without exception, as reordering introduces broken imports, type errors, and mismatched GROQ projections.

### On-Demand Loading Architecture

The skill employs on-demand loading to maintain focused interactions and optimize token usage:

- **Core router** (`SKILL.md`) maintains a compact workflow table, lookup table for reference files, and hard rules
- **Workflow steps** load individually; a session on Step 1 never loads Step 5
- **Protocols** load only when needed; irrelevant protocols remain unloaded
- **References** (field factories, GROQ fragments, type catalogs) are fetched on demand via lookup table

This architecture ensures AI interactions remain focused on current tasks with minimal token overhead.

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

All 9 registered protocols, organized by tier:

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

---

## Bootstrap

Bootstrap executes once on first AI invocation when `.stackshift/installed.json` is absent in the project root. It materializes selected protocols and creates project infrastructure (_registry.json, _template/, references/) to enable protocol customization and extension.

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
| **None** | Nothing. `/docs/` remains empty. Skill falls back to bundled copies at lookup. |
| **Required** | All `tier: required` protocols only. Minimal customizable surface. |
| **Recommended** (default) | All required and recommended protocols. Standard baseline. |
| **All** | All registered protocols and seeds, including optional. |
| **Interactive** | Checkbox prompt with required and recommended pre-selected, optional unchecked. |

### Project Customization Mechanism

After bootstrap completion:

1. **Protocol lookup priority:**
   ```
   /docs/protocol/<id>.md (project) → protocols/<id>.md (skill fallback)
   /docs/protocol/<id>/ (project) → protocols/<id>/ (skill fallback)
   ```

2. Project copies take precedence over bundled skill copies at every lookup
3. Edits persist across skill updates; customizations are never overwritten
4. Deleting a file from `/docs/protocol/` falls back to bundled default

This design enables teams to version protocols alongside their codebase while benefiting from skill updates to workflow and references.

---

## Customizing Protocols

After bootstrap, protocols can be customized and extended by editing files in `/docs/protocol/` and adding custom protocols to the project registry.

### What Can Be Extended

**Protocols** (`/docs/protocol/`)
- Edit materialized protocols from bootstrap  (project copy takes precedence)
- Add custom project-specific protocols
- Register custom protocols in `/docs/protocol/_registry.json`
- Custom protocols are discovered from project registry

**References** (`/docs/references/`)
- Add custom reference lookups for project-specific protocols
- Augment skill references with project-specific data
- Empty by default; add as needed

**Seeds** (Not Customizable)
- Standard strategies loaded from skill when needed

**Workflow** (Not Customizable)
- Workflow steps remain in skill (`stackshift-core/workflow/`)
- Defines the 5-step sequence and cannot be modified
- Custom protocols integrate into existing workflow steps

### File Structure After Bootstrap

After bootstrap with "Recommended" mode:

```
your-project/
├── .stackshift/
│   └── installed.json          # Bootstrap marker (mode, protocols, timestamp)
│
└── docs/
    ├── protocol/
    │   ├── _registry.json      # Project protocol registry (custom protocols)
    │   ├── _template/          # Template for complex multi-file protocols
    │   ├── factory-function-pattern.md
    │   ├── sub-field-visibility.md
    │   ├── variant-router.md
    │   ├── one-time-custom-schema-setup.md
    │   ├── field-reuse-first.md
    │   ├── hide-if-variant.md
    │   ├── preview-conventions.md
    │   ├── array-layout.md
    │   └── section-directory-layout.md
    │
    └── references/             # Custom reference lookups (empty initially)
        └── README.md
```

### Adding Custom Protocols

#### Simple Single-File Protocol

1. Create `/docs/protocol/custom-image-sizing.md`:
   ```markdown
   # Custom Image Sizing Protocol

   **Tier:** recommended
   **Applies to:** Step 1 (Schema fields)

   ## Description
   All image fields must specify explicit width/height constraints...

   ## Implementation
   [Your convention details]
   ```

2. Register in `/docs/protocol/_registry.json`:
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

1. Copy template: `cp -r docs/protocol/_template/ docs/protocol/custom-protocol/`

2. Edit files in `/docs/protocol/custom-protocol/`:
   - `SKILL.md` - Main entry point
   - `architecture.md` - Architecture decisions
   - `checklist.md` - Done-when criteria
   - Add additional files as needed

3. Register in `/docs/protocol/_registry.json`:
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

1. Create `/docs/references/custom-lookups.md`:
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
   See `/docs/references/custom-lookups.md` for standard image sizes.
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
│
├── scripts/
│   └── sync-version.mjs          # Syncs skill.version to package.json, cli/package.json, README.md
│
├── skills/
│   ├── stackshift-core/
│   │   ├── SKILL.md              # Main router: workflow table, lookup table, hard rules
│   │   ├── workflow/             # 5 step files and checklist (loaded on demand)
│   │   ├── protocols/            # 9 protocol files and _registry.json
│   │   ├── references/           # Lookup tables (field factories, GROQ, types, versions)
│   │   ├── seeds/                # Seeding strategies and _registry.json (empty in v0.1.2)
│   │   └── bootstrap/            # First-run install flow and modes
│   │
│   ├── stackshift-protocols-required/
│   │   └── SKILL.md              # Index: 4 required protocols
│   │
│   ├── stackshift-protocols-recommended/
│   │   └── SKILL.md              # Index: 4 required + 5 recommended
│   │
│   └── stackshift-protocols-full/
│       └── SKILL.md              # Index: all tiers
│
└── cli/                          # Interactive installer (npx @extragraj/stackshift-skills init)
    ├── package.json              # CLI package (stackshift-cli)
    ├── tsconfig.json
    └── src/
        ├── index.ts              # Command router
        ├── install.ts            # Orchestrates init flow
        ├── registry.ts           # Loads skills via gray-matter
        ├── prompts.ts            # Interactive prompts (@clack/prompts)
        └── writer.ts             # Copies skills, writes lock file and bootstrap marker
```

**Architecture Notes:**
- `stackshift-core` contains all protocols, workflow steps, and references
- Protocol tier bundles (`required/recommended/full`) contain only `SKILL.md` index files
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

---

## Version Compatibility

| Dependency | Version |
|------------|---------|
| Sanity | v3.17 |
| Next.js | 14, Pages Router |
| TypeScript | strict mode |
| `@webriq-pagebuilder/sanity-plugin-schema-default` | extend, do not replace |
| `@stackshift-ui/*` | component library, referenced in `index.tsx` only |

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
