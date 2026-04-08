---
name: stackshift-core
description: >
  Implements sections, variants, fields, and GROQ queries in StackShift
  (composable Sanity + Next.js Pages Router page-builder) projects. Triggers on:
  "add section", "new variant", "add field", "create stackshift section",
  "register section", "add variant to", "extend schema", "sanity section",
  "page-builder section", or any work touching `schemas/custom/**`,
  `components/sections/**`, `pages/api/query.ts`, or `types.ts` in a
  StackShift project. Enforces the strict 5-step implementation order and
  delegates component rendering work to the `ui-forge` skill.
---

# StackShift

Schema → Section → Types → Variant → GROQ. In that order. Never reordered.

Delegates all component rendering to `ui-forge`.

---

## 0. Bootstrap check (first invocation only)

Before doing any workflow step:

### 1. Validate installation integrity

Check for multi-tier installations by listing all folders in `.agents/skills/` and `.claude/skills/` (if they exist):

```bash
# Find all protocol bundle folders
ls .agents/skills/ 2>/dev/null | grep "^stackshift-protocols-"
ls .claude/skills/ 2>/dev/null | grep "^stackshift-protocols-"
```

Count the unique protocol bundle folder names found.

**If multiple protocol bundles detected (count > 1):**

```
⚠️ Installation Issue Detected

Multiple protocol tier bundles found:
[list unique folder names, e.g., stackshift-protocols-required, stackshift-protocols-full]

Only ONE protocol tier should be active at a time.
Each tier already includes all lower tiers, so having multiple is redundant and can cause confusion.

To fix this issue:
1. Run: npx @extragraj/stackshift-skills repair
   OR
2. Manually delete all but one protocol bundle folder from .agents/skills/ and .claude/skills/
3. Run this skill again

Which tier do you want to keep?
(Check .stackshift/installed.json for your intended tier selection)
```

**Stop workflow.** Wait for user to fix installation before proceeding.

**If stackshift-core folder is missing from .agents/skills/ or .claude/skills/:**

```
⚠️ Missing Required Skill

stackshift-core is required for StackShift sections.
It provides the workflow, protocols, and references system.

To fix:
Run: npx @extragraj/stackshift-skills init
```

**Stop workflow.** Wait for user to install.

### 2. Check bootstrap marker

If installation is valid, check the project root for `.stackshift/installed.json`.

- **Missing** → run `bootstrap/install.md`. Stop. Return here after user confirms.
- **Present** → skip. Proceed to workflow.

This materializes selected protocols, creates project infrastructure (_registry.json, _template/, references/), and enables custom protocol development.

---

## 1. Workflow at a glance

The implementation order is **strict**. Each step must complete before the next begins.

| # | Step | File to load | Writes to |
|---|------|--------------|-----------|
| 1 | Schema fields | `workflow/1-schema-fields.md` | `schemas/custom/.../common/fields.ts` |
| 2 | Section schema | `workflow/2-section-schema.md` | `schemas/custom/.../sections/[name]/` |
| 3 | TypeScript types | `workflow/3-types.md` | `types.ts` |
| 4 | Component variant | `workflow/4-variants.md` → **invokes `ui-forge`** | `components/sections/[name]/` |
| 5 | GROQ query | `workflow/5-groq.md` | `pages/api/query.ts` |
| 6 | Verify | `workflow/checklist.md` | — |

**Load only the step you are on.** Do not pre-load all steps.

**Why this order:** Missing types/files break TypeScript and module resolution. GROQ failures only affect data output — safe to do last. See `workflow/1-schema-fields.md` for the full rationale.

---

## 2. When to invoke `ui-forge`

Step 4 is the only step that calls `ui-forge`. StackShift owns the *schema and wiring*; `ui-forge` owns the *component code*.

```
INVOKE ui-forge
  task: Build variant_[x].tsx for section [sectionName]
  refs: [any reference HTML/TSX/image the user provided]
  context: Props interface is `[SectionName]Props` from "."
```

Before invoking `ui-forge`, the StackShift workflow must have already:
1. Completed steps 1–3 (fields, section schema, types)
2. Created an empty `variant_[x].tsx` file
3. Registered the dynamic import in `components/sections/[name]/index.tsx`
4. Exported the props interface from `index.tsx`

`ui-forge` then fills the variant file body using the props interface as the contract. See `workflow/4-variants.md`.

---

## 3. Lookup router — load on demand

Do not load these preemptively. Load only when the current workflow step or error mentions the topic.

| Need | Load |
|------|------|
| "Which file does what?" | `references/file-map.md` |
| Existing field factories to reuse | `references/field-factories.md` |
| Existing TypeScript interfaces to reuse | `references/types-catalog.md` |
| Reusable GROQ fragment constants | `references/groq-fragments.md` |
| Version constraints (Sanity v3.17, Next 14, etc.) | `references/versions.md` |
| A protocol (required / recommended / optional convention) | See "Protocol Discovery" below |
| A custom reference lookup | `/docs/references/<name>.md` (project), else `references/<name>.md` (skill) |

### Protocol Discovery

Protocols are discovered from **merged registries**:

1. **Read project registry** (if exists): `/docs/protocol/_registry.json`
2. **Read skill registry**: `protocols/_registry.json`
3. **Merge:** Project protocols take precedence over skill protocols with same ID
4. **Load on-demand:** When protocol is needed, load from:
   - `/docs/protocol/<id>.md` or `/docs/protocol/<id>/` (project)
   - `protocols/<id>.md` or `protocols/<id>/` (skill fallback)

**Custom protocols** registered in `/docs/protocol/_registry.json` are discovered alongside skill protocols.

### Protocol Tiers

Each protocol has a **tier** in its registry entry:

- **required** — Workflow cannot function correctly without it. Violations cause build errors, runtime errors, or schema load failures. Workflow steps enforce these.
- **recommended** — Quality and UX. No errors if omitted, but Sanity Studio or author experience suffers. Workflow steps mention but do not block.
- **optional** — Opt-in systems with their own architecture, dependencies, or directories. Only apply if the project adopts them.

### Protocol File Types

A protocol entry can be:
- **Single file** (`.md`) — Simple convention documents
- **Directory** (multiple files) — Complex protocols with sub-docs, schemas, or templates

Use `_template/` as starting point for directory-based protocols.

### Reference Augmentation

Custom references for project-specific protocols:

1. **Check project:** `/docs/references/<name>.md` (custom reference lookups)
2. **Fall back to skill:** `references/<name>.md` (standard references)

Project references augment skill references without modifying them.

---

## 4. Adding Custom Protocols (Project-Level)

To add a custom protocol in your project:

### Simple Single-File Protocol

1. Create protocol file: `/docs/protocol/custom-protocol-name.md`
2. Register in `/docs/protocol/_registry.json`:
   ```json
   {
     "protocols": [
       {
         "id": "custom-protocol-name",
         "tier": "recommended",
         "file": "custom-protocol-name.md",
         "title": "Custom Protocol Name",
         "summary": "What this protocol governs"
       }
     ]
   }
   ```
3. Register in `/docs/protocol/_registry.json`

### Complex Multi-File Protocol

1. Copy template: `cp -r /docs/protocol/_template/ /docs/protocol/custom-protocol/`
2. Edit files in `/docs/protocol/custom-protocol/` (SKILL.md, architecture.md, checklist.md, etc.)
3. Register in `/docs/protocol/_registry.json` with `"dir": "custom-protocol/"`

### Custom References

Add custom reference lookups in `/docs/references/<name>.md` for project-specific data that your custom protocols need.

---

## 5. Extending the Skill (Skill Maintainers)

For skill maintainers adding protocols to the core skill:

- **New protocol** → add file to `protocols/`, register in `protocols/_registry.json`. Existing projects can add it to their project registry.
- **New workflow step** → add file to `workflow/`, add row to table in Section 1.
- **New reference** → add file to `references/`, add row to lookup router in Section 3 above.

---

## 6. Hard rules (always apply)

- Never reorder steps 1–5.
- Never use Sanity v4+ APIs (`defineConfig`, etc.). Project is v3.17.
- Never use `any` in TypeScript.
- Never write GROQ projections for scalar fields — `...` spread covers them.
- Never hardcode a fallback variant in `index.tsx` — render `null` when `data?.variant` is absent.
- Never import a variant's props interface from `@stackshift-ui` — always from `"."`.
- Never create duplicate field names at the section level — use sub-field `hidden` instead.
- Never wrap field factories in `defineField()` / `defineType()` — plain objects only.
