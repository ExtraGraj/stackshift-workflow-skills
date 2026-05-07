# End-to-End Checklist

Run after the last step. Items are grouped by tier — **required** items must all pass before shipping. **Recommended** items should pass unless there's a specific reason to skip (document the reason).

---

## Required — must pass

### Step 1 — Schema Fields
- [ ] New fields follow the factory function pattern with `hidden` + `_hideInVariants`
- [ ] Plain object syntax in factories — no `defineField()` / `defineType()` wrappers
- [ ] No duplicate field names at section level (sub-field visibility uses `hidden` on the sub-field)
- [ ] `hideIfVariantIn` and `hideInVariants` imports come from `@webriq-pagebuilder/sanity-plugin-schema-default`

### Step 2 — Section Schema
- [ ] One-time custom schema setup has been completed for this project
- [ ] All imports resolve (`rootSchema`, field factories)
- [ ] New variant added to `variantsList` after spreading base, with a `description`
- [ ] Section registered in `schemas/custom/.../sections/index.ts`
- [ ] `initialValue` NOT passed into `rootSchema()`

### Step 3 — TypeScript Types
- [ ] Every new field has a corresponding entry in the `Variants` interface
- [ ] No `any` types anywhere

### Step 4 — Component Variant
- [ ] `variant_[x].tsx` existed on disk before its `dynamic()` import was registered (4a → 4b)
- [ ] `dynamic(() => import("./variant_[x]"))` added to the `Variants` map
- [ ] If new section type: registered in `components/list.tsx`
- [ ] Local props interface defined and exported in `index.tsx`
- [ ] Props extracted with `data?.variants?.field ?? undefined` for every field
- [ ] No hardcoded fallback variant — renders `null` when `data?.variant` is absent
- [ ] Props interface imported from `"."` in the variant file (never from `@stackshift-ui`)
- [ ] Function signature destructures individual props (not `{ data }`)
- [ ] `export default` at top, named export immediately below
- [ ] All preconditions verified before `ui-forge` invocation (empty `variant_[x].tsx` exists, dynamic import registered, props interface exported)
- [ ] `ui-forge` invoked with `--signal CONVERT_VARIANT` and `--mode body-only`
- [ ] All postconditions passed (FORGE NOTES header present, `index.tsx` unchanged, no unexpected files created)
- [ ] No StackShift-managed files were modified by `ui-forge` (only the `variant_[x].tsx` body)

### Step 5 — GROQ Query
- [ ] Only non-scalar fields have explicit projections
- [ ] Scalars left to the `...` spread
- [ ] All projections use the null-check pattern
- [ ] Reusable fragment constants interpolated — no inline rewrites of known shapes

### Quality Gate
- [ ] No TypeScript `any`
- [ ] Optional chaining (`?.`) applied wherever Sanity data could be null/undefined
- [ ] No Sanity v4+ APIs used
- [ ] Imports use the `@/*` path alias
- [ ] `yarn build` or `tsc --noEmit` passes with zero errors

---

## Recommended — should pass

Skipping any of these will not break the build but will degrade the Sanity Studio or author experience.

### Step 1 — Schema Fields
- [ ] Reuse check performed (local `fields.ts` → base package → dynamic factories) before creating new
- [ ] `hideIfVariantIn([])` updated on every field the new variant does not use
- [ ] Every array of objects and every object field has a `preview` block
- [ ] `prepare()` always returns a non-empty `title`
- [ ] Image arrays use `options: { layout: "grid" }`; tag arrays use `{ layout: "tags" }`

### Step 2 — Section Schema
- [ ] `initialValue/` created and populated for every variant with contextual placeholder copy
- [ ] `images/` has one thumbnail per variant, named to match the variant `value`

### Step 4 — Component Variant
- [ ] Conditional rendering uses ternary with `null` (not `&&` short-circuit)
- [ ] Default prop values in destructuring, not inline in JSX
- [ ] Helper components placed below all exports
- [ ] FORGE NOTES contains `// @contract <path>` directive on line 3 (UI Forge ≥ 0.1.9)
- [ ] `design/design-arch.json` is no older than 7 days (UI Forge warns at 8+; re-run `/forge-scan` if stale)

---

## Protocol-conditional — fires only when the protocol is in the materialized set

### `accessibility` active
- [ ] FORGE NOTES contains an `A11Y` sub-block on every variant generated this session
- [ ] `.stackshift/installed.json` has `"a11yRequired": true`

### `brand` active
- [ ] FORGE NOTES contains a `BRAND` sub-block on every variant generated this session
- [ ] `design/design-arch.json` `designStandards.brand` points to an existing file
- [ ] `design/standards/brand.md` is non-empty (not the starter template)

### `claude-design-handoff` active and used this session
- [ ] FORGE NOTES contains a `CLAUDE_DESIGN` sub-block on every handoff-sourced variant
- [ ] `design/.handoff-cache/` and `design/claude-design-bundle/` are listed in `.forgeignore`
- [ ] No handoff-generated CSS classes appear inline in TSX (every token resolves to `design-arch.json`)

### `auto-verify-hook` active
- [ ] `.claude/settings.json` contains the StackShift PostToolUse hook entry
- [ ] Hook fired without errors on every variant write this session (check Claude Code logs or terminal output)

---

## Optional — only if the project adopts the system

Check only if an optional protocol (e.g. modal-and-sheet, commerce, blog) is installed for this project. Each optional protocol ships its own checklist — consult `.stackshift/protocols/<protocol-name>/` for specifics.
