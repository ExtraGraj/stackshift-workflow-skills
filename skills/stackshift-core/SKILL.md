---
name: stackshift
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

Before doing any workflow step, check the project root for `.stackshift/installed.json`.

- **Missing** → run `bootstrap/install.md`. Stop. Return here after user confirms.
- **Present** → skip. Proceed to workflow.

This materializes selected protocol and seed reference docs into the project's `/docs/protocol/` and `/docs/seed/` folders so the team can customize them.

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
| ✅ | Verify | `workflow/checklist.md` | — |

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
| A protocol (required / recommended / optional convention) | `/docs/protocol/<id>.md` or `/docs/protocol/<id>/` in project, else `protocols/<id>.md` or `protocols/<id>/` in skill |

### Protocol tiers

Protocols are tagged with a **tier** in `protocols/_registry.json`:

- **required** — Workflow cannot function correctly without it. Violations cause build errors, runtime errors, or schema load failures. The workflow steps reference these inline.
- **recommended** — Quality and UX. No errors if omitted, but Sanity Studio or author experience suffers. Workflow steps mention them but do not block on them.
- **optional** — Opt-in systems that bring their own architecture, dependencies, or directories. Only apply if the project has adopted the system.

**Project docs win over skill docs.** `/docs/protocol/` is the customized source of truth once bootstrap has run. Edits in the project override the skill's defaults without re-bootstrapping.

A protocol entry can be either a **file** (`.md`) or a **directory** containing multiple files — useful for complex optional protocols with sub-docs, schemas, or templates. See README for the full pattern.

---

## 4. Extending the skill

- **New protocol (single file)** → drop a markdown file in `protocols/`, add an entry to `protocols/_registry.json` with a `tier` (required / recommended / optional). Re-bootstrap to pick it up in existing projects.
- **New protocol (complex, multi-file)** → copy `protocols/_template/` to `protocols/<id>/`, fill in each skeleton file, then register with `"dir": "<id>"` instead of `"file"`. See README for the full pattern.
- **New workflow step** → add a file to `workflow/`, add a row to the table in Section 1.
- **New lookup** → add a file to `references/`, then add a matching row to the lookup router table in Section 3 above. The Section 3 table is the only discovery mechanism — a new file in `references/` is invisible to the workflow until a row exists there.

See `README.md` for the full contribution guide and the complex-protocol authoring template.

---

## 5. Hard rules (always apply)

- Never reorder steps 1–5.
- Never use Sanity v4+ APIs (`defineConfig`, etc.). Project is v3.17.
- Never use `any` in TypeScript.
- Never write GROQ projections for scalar fields — `...` spread covers them.
- Never hardcode a fallback variant in `index.tsx` — render `null` when `data?.variant` is absent.
- Never import a variant's props interface from `@stackshift-ui` — always from `"."`.
- Never create duplicate field names at the section level — use sub-field `hidden` instead.
- Never wrap field factories in `defineField()` / `defineType()` — plain objects only.
