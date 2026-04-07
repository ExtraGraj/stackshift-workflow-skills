# StackShift Skill

A structured agentic skill for developing sections and variants in StackShift, a composable page-builder built on Sanity v3 and Next.js. Enforces a strict 5-step implementation workflow, applies tiered conventions through a protocol system, and coordinates with the `ui-forge` skill for component rendering.

**Version:** 0.1.0

---

## How It Works

Every section is built through the same five steps, always in this order:

```
1. Schema fields   →   2. Section schema   →   3. TypeScript types
                   →   4. Component variant (ui-forge)   →   5. GROQ query
```

Each step depends on the output of the previous one. Reordering breaks the type chain and the skill enforces this sequence without exception.

A **protocol system** sits alongside the workflow to codify team conventions. Protocols are tiered by impact:

| Tier | Effect if Skipped |
|---|---|
| **Required** | Build errors, runtime errors, or schema load failures |
| **Recommended** | No errors, but Studio UX or author experience degrades noticeably |
| **Optional** | Opt-in systems with their own architecture, only applicable if the project adopts them |

Protocols are loaded on demand as the workflow progresses, not pre-loaded in full.

---

## Installation

Both options install to `.agents/skills/`. `stackshift-core` is always required regardless of which path you choose.

### Option A — npx skills add

```bash
npx skills add stackshift/stackshift-core
npx skills add stackshift/stackshift-protocols-recommended
```

Available protocol tiers: `stackshift-protocols-required`, `stackshift-protocols-recommended`, `stackshift-protocols-full`.

On the first AI invocation, a one-time bootstrap runs and asks which protocol tier to materialize into your project's `/docs/protocol/` folder. Those files become the team's editable source of truth and take precedence over the skill's defaults without requiring a reinstall.

### Option B — npx stackshift init

An interactive CLI that guides you through tier selection and install scope, installs the relevant skills, and pre-writes the bootstrap marker so the AI proceeds directly to the workflow on first use.

```bash
npx stackshift init
```

Select **Project** scope to install into the current directory's `.agents/skills/`, or **Global** to install to `~/.agents/skills/` for use across all projects.

> `ui-forge` is a separate companion skill and must be installed independently.

---

## Skill Structure

```
skills/
├── stackshift-core/
│   ├── SKILL.md               # main router: workflow steps, protocol lookup table, hard rules
│   ├── workflow/              # one file per step, loaded on demand
│   ├── protocols/             # full protocol library and registry
│   ├── references/            # on-demand lookup tables (field factories, GROQ, types, versions)
│   ├── seeds/                 # seeding strategies (none registered in v0.1.0)
│   └── bootstrap/             # first-run install and materialization flow
│
├── stackshift-protocols-required/    # tier index — 4 required protocols
├── stackshift-protocols-recommended/ # tier index — required + 5 recommended protocols
└── stackshift-protocols-full/        # tier index — all tiers (no optional protocols yet)
```

`stackshift-core` contains all structural content including the full protocol source files. Protocol tier skills contain only a `SKILL.md` index declaring which protocols are in scope and when to load each one. Protocol content is sourced from `stackshift-core/protocols/` and loaded on demand.

---

## Protocol Customization

Once bootstrap runs, the selected protocol files are copied to `/docs/protocol/` in your project. The skill checks that directory first at every lookup, falling back to its bundled copies only if a file is absent. Teams can freely edit the project copies as they persist across skill updates and serve as the project's authoritative reference.

---

## Extending the Skill

### Adding a Protocol

Place a `.md` file in `stackshift-core/protocols/` and register it in `protocols/_registry.json` with an `id`, `tier`, `file`, `title`, and `summary`. For protocols that introduce multiple files or an entire subsystem, use the directory form (`dir` instead of `file`) and use `protocols/_template/` as the authoring reference.

### Adding a Workflow Step

Add a file to `workflow/`, add a row to the step table in `SKILL.md` Section 1, and update `workflow/checklist.md`.

### Adding a Reference Lookup

Add a file to `references/`, then add a corresponding row to the lookup router in `SKILL.md` Section 3. Files not listed in that table are not discoverable by the workflow.

After any structural change, increment `skill.version`.

---

## Companion Skill

During the component variant phase of the workflow, StackShift hands off to `ui-forge` to generate the variant TSX. StackShift defines the props interface and wires the section router while `ui-forge` handles all component authoring from there. The two skills have clearly separated responsibilities and never duplicate each other's work.

---

## Version Compatibility

Sanity v3.17 · Next.js 14 Pages Router · TypeScript strict · `@webriq-pagebuilder/sanity-plugin-schema-default`

See `references/versions.md` for the full compatibility matrix.
