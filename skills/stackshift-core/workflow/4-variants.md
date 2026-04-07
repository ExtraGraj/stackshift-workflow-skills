# Step 4 — Component Variant

> This is the ONLY step that delegates to `ui-forge`.
> StackShift owns the wiring (index.tsx, props interface, dynamic import).
> `ui-forge` owns the variant body (JSX + component library usage).

Strict sub-step order: **4a → 4b → 4c → 4d**. Do not reorder.

---

## 4a — Create the empty variant file

```bash
# The file must exist on disk before its dynamic() import can be registered.
touch components/sections/[section-name]/variant_[x].tsx
```

Start with a minimal stub so the file resolves:

```typescript
// variant_[x].tsx
import { MySectionProps } from ".";
export default function MySection_X(_props: MySectionProps) { return null; }
export { MySection_X };
```

→ Proceed to 4b.

---

## 4b — Register the dynamic import in `index.tsx`

```typescript
// components/sections/[section-name]/index.tsx
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
```

If this is a **new section type** (not just a new variant), also register it in `components/list.tsx`:

```typescript
mySection: dynamic(
  () => import("components/sections/my-section").then((m) => m.MySection)
),
```

→ Proceed to 4c.

---

## 4c — Write the props interface and extraction in `index.tsx`

```typescript
export interface MySectionProps {
  title?: string;
  description?: string;
  primaryButton?: LabeledRouteWithKey;
  // ...one entry per field this section's variants can consume
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

  if (!Variant) return null;     // ← no hardcoded fallback variant

  return <Variant {...props} />;
}

export default MySection;
```

**Hard rules:**
- Function signature is `{ data }: SectionsProps` — not a custom props type.
- Every field uses `?? undefined`.
- Render `null` when `data?.variant` is absent. **Never** hardcode a fallback.

See `protocols/variant-router.md` for the full pattern.

→ Proceed to 4d.

---

## 4d — Fill the variant body (INVOKE `ui-forge`)

The props interface is now exported from `"."`. Hand off to `ui-forge`:

```
INVOKE ui-forge
  task: Implement variant_[x].tsx for the [sectionName] section.
        The component receives individual props destructured in the function
        signature (NOT { data }). Props interface: [SectionName]Props from ".".
        Use the project's component standard (loaded from design-arch.json).

  refs: [any HTML/TSX/image reference files the user provided]

  context:
    - Props interface location: components/sections/[section-name]/index.tsx
    - File to write: components/sections/[section-name]/variant_[x].tsx
    - Conventions: import props from ".", default export at top, named export
      immediately below, ternary-with-null for conditionals (not &&).
```

**`ui-forge` must honor these StackShift-specific rules** (include them in the invocation context if not obvious from design-arch):

```typescript
// variant_[x].tsx
import { MySectionProps } from ".";                  // ← always from "."

export default function MySection_X({
  title,
  description,
  optionalProp = "default",                           // ← defaults in destructure
}: MySectionProps) {
  return (
    <Section>
      {title ? <Heading title={title} /> : null}     {/* ← ternary, not && */}
    </Section>
  );
}

export { MySection_X };                               // ← named export after default

function Heading({ title }: { title: string }) {     // ← helpers below all exports
  return <h2>{title}</h2>;
}
```

---

## Done when

- [ ] `variant_[x].tsx` created (4a)
- [ ] `dynamic()` import registered in `index.tsx` (4b)
- [ ] If new section: registered in `components/list.tsx`
- [ ] Props interface defined and exported from `index.tsx` (4c)
- [ ] Props extracted with `?? undefined` for every field (4c)
- [ ] No hardcoded fallback variant (4c)
- [ ] Variant body generated via `ui-forge` and honors StackShift conventions (4d)

→ Proceed to `workflow/5-groq.md`.
