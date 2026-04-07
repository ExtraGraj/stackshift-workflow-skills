# Protocol — Factory Function Pattern

**Applies to:** Step 1 (Schema Fields)
**Rule strength:** Required when creating a new field

Every new field in `fields.ts` must follow one of these two patterns.

---

## Fixed naming (single-purpose field)

```typescript
export const myField = (hidden?: ({ document }: DocumentProps) => boolean) => ({
  name: "myField",
  title: "My Field",
  hidden,
  _hideInVariants: hidden && hideInVariants,
  type: "string",
});
```

## Dynamic naming (reusable across contexts)

```typescript
export const myField = (
  name: string | null,
  displayTitle: string | null,
  displayDescription: string | null,
  hidden?: ({ document }: DocumentProps) => boolean,
) => ({
  name,
  title: displayTitle,
  description: displayDescription,
  hidden,
  _hideInVariants: hidden && hideInVariants,
  type: "string",
});
```

---

## Rules

- Return a **plain object**. Do NOT wrap in `defineField()` or `defineType()`.
- Always accept an optional `hidden` predicate.
- Always set `_hideInVariants: hidden && hideInVariants`.
- Import `hideInVariants` from `@webriq-pagebuilder/sanity-plugin-schema-default`.
- If the field is an object with sub-fields, each sub-field can have its own `hidden` predicate — see `sub-field-visibility.md`.

---

## Object field factory example

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
      hidden: ({ document }: DocumentProps) =>
        ["variant_b", "variant_c"].includes(document?.variant),
    },
  ],
  preview: { /* required — see preview-conventions.md */ },
});
```
