# Step 3 — TypeScript Types

> Load `references/types-catalog.md` for the full list of reusable interfaces.

---

## Reuse first — check `types.ts`

Before creating a new interface, check `types.ts` for a match. Common reusables:

| Schema field shape | Reuse interface |
|---|---|
| `mainImage` / image + alt | `MainImage` |
| `conditionalLink` with key (array items) | `LabeledRouteWithKey` |
| `conditionalLink` without key | `LabeledRoute` |
| Raw link (internal/external) | `ConditionalLink` |
| Logo fields | `Logo` |
| Social media fields | `SocialLink` |
| Form fields | `Form` |
| Title + text array items | `ArrayOfTitleAndText` |

---

## Creating a new interface (only when truly novel)

Place under the Variants Interface section in `types.ts`:

```typescript
export interface MyFieldTypes {
  fieldA?: string;
  fieldB?: string;
  fieldC?: number;
}
```

Rules:
- **No `any`.** Use `unknown` + narrowing if the shape is dynamic.
- All fields optional (`?`) — Sanity data can always be null/undefined.
- Prefer composing existing interfaces over defining new ones.

---

## Add the field to `Variants`

```typescript
export interface Variants {
  // ...existing fields
  myField?: MyFieldTypes;
  myButton?: LabeledRouteWithKey;
  myImage?: MainImage;
  myLink?: LabeledRoute;
}
```

---

## Done when

- [ ] Reuse check performed — no duplicate interfaces created
- [ ] Any new interface is added under the Variants Interface section
- [ ] Every new field from Step 1 has a corresponding entry in `Variants`
- [ ] No `any` types

→ Proceed to `workflow/4-variants.md`.
