# Protocol — Sub-Field Visibility

**Applies to:** Step 1 (Schema Fields)
**Rule strength:** Required

When only a specific **sub-field** of a shared object field should be hidden for certain variants, apply `hidden` directly on the sub-field.

**Do NOT** add a duplicate field name at the section level — Sanity rejects duplicate field names at schema load time.

---

## ✅ Correct

```typescript
export const myObjectField = (hidden?: ({ document }: DocumentProps) => boolean) => ({
  name: "myObjectField",
  type: "object",
  hidden,
  _hideInVariants: hidden && hideInVariants,
  fields: [
    title(),
    {
      name: "badge",
      title: "Badge",
      type: "string",
      // Hide the sub-field for specific variants
      hidden: ({ document }: DocumentProps) =>
        ["variant_b", "variant_c"].includes(document?.variant),
    },
  ],
});
```

## ❌ Incorrect — duplicate field name at section level

```typescript
// This breaks schema load:
export const heroSchema = [
  myObjectField(),
  myObjectField({ hidden: hideIfVariantIn(["variant_b"]) }), // duplicate "myObjectField" — rejected
];
```
