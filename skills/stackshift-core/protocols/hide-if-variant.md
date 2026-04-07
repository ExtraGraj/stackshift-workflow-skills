# Protocol — Hide If Variant

**Applies to:** Step 1 (Schema Fields) whenever a new variant is added
**Rule strength:** Required

When adding a new variant, go through **every field** in the section's `schema/index.ts` and declare the new variant in `hideIfVariantIn([])` on any field it does not use.

---

## Core rule

- New variant DOES NOT use a field → add variant name to that field's `hideIfVariantIn([...])`
- New variant DOES use a field → leave unchanged

---

## Checklist when adding a variant

1. Open the section's `schema/index.ts`.
2. For each field:
   - Does the new variant use it? → no change.
   - Does the new variant not use it? → add the variant value to the field's `hideIfVariantIn([...])` array.
3. Verify every field has been considered before committing.

---

## Example

```typescript
import { hideIfVariantIn } from "@webriq-pagebuilder/sanity-plugin-schema-default";

export const heroSchema = [
  title({ hidden: hideIfVariantIn(["variant_e"]) }),          // hidden for variant_e
  subtitle({ hidden: hideIfVariantIn(["variant_e", "variant_f"]) }),
  primaryButton({ hidden: hideIfVariantIn(["variant_f"]) }),
];
```

---

## Anti-pattern

**Don't** rely on the variant's component ignoring the field at render time. Sanity Studio authors must not see irrelevant fields. Always declare exclusions at the schema level.
