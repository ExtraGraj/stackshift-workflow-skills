# Step 2 — Section Schema

> **Protocol Discovery for This Step:**
>
> Load protocols from merged registry (project + skill) where `appliesTo` includes Step 2:
> 1. Read `.stackshift/protocol/_registry.json` (if exists)
> 2. Read `protocols/_registry.json` from skill
> 3. Merge registries (project protocols override skill protocols with same ID)
> 4. Filter protocols: `tier === 'required'` OR `tier === 'recommended'`
> 5. Load each protocol from `.stackshift/protocol/<id>` (project) OR `protocols/<id>` (skill)
>
> **Required protocols** (load and enforce):
> - One-Time Custom Schema Setup — run once per project, or custom sections never appear
>
> **Recommended protocols** (load if present, but do not block):
> - Section Directory Layout — covers `initialValue/` and `images/` directories

---

## 0. One-time setup (skip if already done)

If the project's custom schema merge has not been wired up, follow `protocols/one-time-custom-schema-setup.md` ONCE, then never again. Without this, any new section you add in step 2 won't appear in Sanity Studio.

---

## Required actions

### 1. Required directory structure

```
schemas/custom/sanity-plugin-schema-default/src/schemas/sections/[section_name]/
├── [sectionName].ts        # Main entry — required
└── schema/
    └── index.ts            # Field definitions — required
```

The `images/` and `initialValue/` directories are recommended but not required for the section to load. See `section-directory-layout` if installed.

### 2. Naming

| Element | Convention | Example |
|---|---|---|
| Directory | `snake_case` | `call_to_action` |
| Main file | `camelCase.ts` | `callToAction.ts` |
| Schema constant | `[sectionName]Schema` | `callToActionSchema` |
| Variants constant | always `variantsList` | `variantsList` |

### 3. Main entry file shape

```typescript
import { rootSchema } from "@webriq-pagebuilder/sanity-plugin-schema-default";
import { callToActionVariants as baseVariantsList } from "@webriq-pagebuilder/sanity-plugin-schema-default";
import { callToActionSchema } from "./schema";

export const variantsList = [
  ...baseVariantsList,
  {
    title: "Variant F",
    value: "variant_f",
    description: "Brief description of what this variant does",
  },
];

export default rootSchema({
  name: "callToAction",
  schema: callToActionSchema,
  variants: variantsList,
});
```

**Rules:**
- Import `rootSchema` and base variants from `@webriq-pagebuilder/sanity-plugin-schema-default` — never redefine locally.
- `variantsList` always spreads `baseVariantsList` first.
- Every new variant entry must include a `description`.
- **Do NOT** pass `initialValue` into `rootSchema()`.

### 4. Register the section

```typescript
// schemas/custom/sanity-plugin-schema-default/src/schemas/sections/index.ts
import { default as mySection } from "./my_section/mySection";
const schemas = { ..., mySection };
export default schemas;
```

Without registration, the section never loads.

### 5. Adding a section not yet present locally

Copy the base structure from:
`node_modules/@webriq-pagebuilder/sanity-plugin-schema-default/src/schemas/sections/[section_name]/`

Then customize inside your local `schemas/custom/` tree.

---

## Recommended actions

- **Check active seed strategy** — Read `.stackshift/installed.json` for a `seed` field.
  If present, look up the id in `seeds/_registry.json` and load the matching `seeds/<file>`.
  Follow its strategy before writing any `initialValue/` file.
- **Populate `initialValue/`** with placeholder content for every variant. Empty forms are a poor author experience. → `section-directory-layout`
- **Populate `images/`** with one preview thumbnail per variant, named to match the variant's `value`. → `section-directory-layout`

---

## Required done-when

- [ ] All imports resolve (`rootSchema`, field factories)
- [ ] New variant added to `variantsList` after spreading base, with `description`
- [ ] Section registered in `sections/index.ts`
- [ ] `initialValue` NOT passed into `rootSchema()`
- [ ] One-time custom schema setup has been completed for this project

## Recommended done-when

- [ ] `initialValue/` populated for every variant
- [ ] `images/` has one thumbnail per variant, named to match the variant `value`

→ Proceed to `workflow/3-types.md`.
