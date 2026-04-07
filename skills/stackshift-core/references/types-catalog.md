# Reference — Types Catalog

Reusable TypeScript interfaces in `types.ts`. Check these before creating anything new.

---

## Core reusable interfaces

| Interface | Shape | Use for |
|---|---|---|
| `MainImage` | `{ image: SanityImage; alt?: string }` | `mainImage` fields or image+alt pairs |
| `ConditionalLink` | `{ type?; internalLink?; externalLink? }` | Raw link (internal/external) |
| `LabeledRoute` | `ConditionalLink + { label?, linkTarget?, linkType? }` | `conditionalLink` without a key (objects) |
| `LabeledRouteWithKey` | `LabeledRoute + { _key?: string }` | `conditionalLink` inside arrays |
| `Logo` | `ConditionalLink + { alt?, image?, linkTarget? }` | Logo fields |
| `SocialLink` | `{ socialMedia?, socialMediaLink?, socialMediaIcon? }` | Social media fields |
| `Form` | `{ id?, buttonLabel?, name?, fields?, thankYouPage? }` | Form fields |
| `ArrayOfTitleAndText` | `{ _key?, plainText?, title? }` | Title + text array items |

---

## Mapping from schema field → interface

| Schema field / factory | Interface |
|---|---|
| `mainImage()` | `MainImage` |
| `primaryButton()`, `secondaryButton()`, `signInLink()` | `LabeledRouteWithKey` (arrays) or `LabeledRoute` (single) |
| `{ type: "conditionalLink" }` (bare) | `ConditionalLink` |
| Logo fields (from base package) | `Logo` |
| Social media arrays | `SocialLink[]` |
| Form fields | `Form` |
| `arrayOfTitleAndText` / `arrayOfTitleAndDescription` | `ArrayOfTitleAndText[]` |

---

## Variants interface

All section fields flow through a single `Variants` interface in `types.ts`:

```typescript
export interface Variants {
  // ...existing fields
  myNewField?: MyFieldTypes;
  myButton?: LabeledRouteWithKey;
  myImage?: MainImage;
  myLink?: LabeledRoute;
}
```

All fields are optional — Sanity data can always be null/undefined.

---

## Creating new interfaces

Only when no existing interface fits. Place under the Variants Interface section in `types.ts`:

```typescript
export interface MyFieldTypes {
  fieldA?: string;
  fieldB?: string;
  fieldC?: number;
}
```

Rules:
- No `any` — use `unknown` + narrowing for dynamic shapes.
- All fields optional.
- Prefer composition over duplication.
