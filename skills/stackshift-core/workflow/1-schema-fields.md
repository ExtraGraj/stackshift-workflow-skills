# Step 1 — Schema Fields

> **Protocol Discovery for This Step:**
>
> 1. Read `.stackshift/installed.json` → get the `protocols` array.
>    If the file is missing, has no `protocols` array, or the array is not valid JSON, skip enforcement and continue — surface a single warning.
> 2. For each protocol listed below, check if its `id` is present in that array.
>    - If `tier: "required"` and present: load and enforce. Block on any violation before writing a file.
>    - If `tier: "recommended"` and present: load and apply as guidance. Note violations, do not block.
>    - If not present in the array: skip — the user did not install it.
>
> **Required (block on violation):**
> - `factory-function-pattern` — Factory Function Pattern: wrong shape breaks `hideInVariants` at runtime
> - `sub-field-visibility` — Sub-Field Visibility: duplicate field names crash schema load
>
> **Recommended (guidance only — do not block):**
> - `field-reuse-first` — Field Reuse First
> - `hide-if-variant` — Hide If Variant
> - `preview-conventions` — Preview Conventions
> - `array-layout` — Array Layout Conventions

---

## Required actions

### 1. Use the factory function pattern for any new field

Return a plain object. No `defineField()` / `defineType()` wrappers. Always set `_hideInVariants: hidden && hideInVariants`.

See `protocols/factory-function-pattern.md` for the canonical shape.

### 2. Never create duplicate field names at the section level

If only a specific sub-field of a shared object should be hidden for certain variants, apply `hidden` directly on the sub-field. A duplicate field name at section level causes Sanity to reject the schema on load.

See `protocols/sub-field-visibility.md`.

### 3. Two constructs exist — know which you need

| | Global Registered Type | Schema Field Factory |
|---|---|---|
| **Example** | `conditionalLink`, `webriqForm` | `mainImage()`, `customText()` |
| **Defined in** | `/schemas/elements/*.ts` | `schemas/custom/.../common/fields.ts` |
| **How to use** | `type: "conditionalLink"` | Call `mainImage()` or spread `...mainImage()` |
| **Registered?** | Yes — in `/elements/index.ts` | No |
| **Spreadable?** | ❌ | ✅ |

Create a new global type only when multiple unrelated sections need the exact same object shape referenced by name. Otherwise use a field factory.

---

## Recommended actions (consult the matching protocol doc if available)

These do not cause errors if skipped but noticeably degrade Sanity Studio UX:

- **Reuse existing fields first** — check the local `fields.ts`, then base package, then dynamic factories before creating anything new. → `field-reuse-first`
- **Apply `hideIfVariantIn([])` when adding a variant** — walk every field in `schema/index.ts` and exclude the new variant from any field it does not use. → `hide-if-variant`
- **Add a `preview` block to every array of objects and every object field** — image or icon fallback, `prepare()` always returning a non-empty `title`. → `preview-conventions`
- **Pick the right `options.layout` for arrays** — `grid` for images, `tags` for string arrays, collapsible for navs. → `array-layout`

**Lookup order for the AI:** `.stackshift/protocols/<name>.md` in the project first, then `protocols/<name>.md` in the skill folder. Project docs win.

---

## Required done-when

- [ ] New fields follow the factory function pattern
- [ ] No duplicate field names at section level (sub-field visibility handled on the sub-field)
- [ ] Plain object syntax — no `defineField()` wrappers

## Recommended done-when

- [ ] Reuse check performed before creating new fields
- [ ] `hideIfVariantIn([])` updated for the new variant on every unused field
- [ ] Every new array-of-objects and object field has a `preview` block
- [ ] Array fields use the appropriate `options.layout`

→ Proceed to `workflow/2-section-schema.md`.
