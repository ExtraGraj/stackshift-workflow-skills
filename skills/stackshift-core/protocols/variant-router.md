# Protocol — Variant Router (`index.tsx`)

**Applies to:** Step 4 (Component Variant)
**Rule strength:** Required

The section's `index.tsx` has three responsibilities:

1. Map base package variants and local dynamic variants into one `Variants` object
2. Define and export the **local props interface** (`[SectionName]Props`)
3. Accept `{ data }: SectionsProps`, extract fields from `data?.variants`, spread into the chosen variant

---

## Canonical pattern

```typescript
import dynamic from "next/dynamic";
import { SectionsProps } from "@/types";
import { MySectionComponent as BaseMySectionComponent } from "@stackshift-ui/my-section";

const BaseVariants = {
  variant_a: BaseMySectionComponent,
  variant_b: BaseMySectionComponent,
  variant_c: BaseMySectionComponent,
};

const Variants = {
  ...BaseVariants,
  variant_d: dynamic(() => import("./variant_d")),
  variant_e: dynamic(() => import("./variant_e")),
};

export interface MySectionProps {
  title?: string;
  description?: string;
  primaryButton?: LabeledRouteWithKey;
}

export function MySection({ data }: SectionsProps) {
  const Variant = data?.variant
    ? Variants[data.variant as keyof typeof Variants]
    : undefined;

  const props: MySectionProps = {
    title: data?.variants?.title ?? undefined,
    description: data?.variants?.description ?? undefined,
    primaryButton: data?.variants?.primaryButton ?? undefined,
  };

  if (!Variant) return null;

  return <Variant {...props} />;
}

export default MySection;
```

---

## Hard rules

- Function signature is **`{ data }: SectionsProps`** — not a custom props type.
- Every field uses **`?? undefined`** — never assume `data?.variants` fields exist.
- Render **`null`** when `data?.variant` is absent. **Never hardcode a fallback variant.**
- Props interface is **defined and exported here**, then imported from `"."` by variant files.
- Dynamic imports are added to `Variants` **only after** the variant file exists on disk.

---

## Anti-patterns

❌ Hardcoding a default variant:
```typescript
const Variant = Variants[data?.variant ?? "variant_a"]; // BAD
```

❌ Importing props from the component library:
```typescript
import { MySectionProps } from "@stackshift-ui/my-section"; // BAD — use local interface
```

❌ Passing `data` directly to the variant:
```typescript
return <Variant data={data} />; // BAD — spread extracted props instead
```
