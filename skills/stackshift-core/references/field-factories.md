# Reference — Field Factories

Catalog of commonly-available field factories. Check local `common/fields.ts` first — projects often define additional factories there.

---

## Dynamic factories (accept custom names/titles/params)

| Factory | Signature | Best for |
|---|---|---|
| `customText` | `(name, title, desc, placeholder, numberOfInputFields, hidden?)` | Any single string or contact-info array |
| `customInteger` | `(name, title, desc, placeholder, hidden?)` | Integer with custom naming |
| `customDropdown` | `(name, title, desc, values[], hidden?)` | String dropdown with custom options |
| `arrayOfText` | `(name, title, desc, placeholder, hidden?)` | Array of strings with custom naming |
| `blockContentNormalStyle` | `(name, title, desc, hidden?)` | Rich text / block content |
| `arrayOfTitleAndDescription` | `(title, desc, hidden?)` | Lists of title+description |
| `arrayOfTitleAndText` | `(title, desc, hidden?)` | Lists of title+plainText |
| `arrayOfImageTitleAndText` | `(title, desc, hidden?)` | Lists of image+title+text |
| `tags` | `(title?, desc?, hidden?)` | Tag-style string arrays |
| `portfoliosWithCategories` | `(name, title, desc, items, hidden?)` | Categorized portfolio arrays |

---

## Fixed-name factories (commonly available)

Always verify presence in the local `common/fields.ts` before assuming.

- `title()`
- `subtitle()`
- `description()`
- `plainText()`
- `mainImage()` — can be spread: `...mainImage()` to inject `image` + `alt` as siblings
- `primaryButton()` — returns `{ type: "conditionalLink" }`
- `secondaryButton()` — returns `{ type: "conditionalLink" }`
- `signInLink()` — returns `{ type: "conditionalLink" }`

---

## Global registered types (use by name)

Defined in `/schemas/elements/`, exported through `/elements/index.ts`.

| Type name | Use for |
|---|---|
| `conditionalLink` | Internal/external link with link-type toggle |
| `webriqForm` | Form fields connected to WebriQ form submission |

Reference by name in a field definition:
```typescript
{ name: "myLink", type: "conditionalLink" }
```

---

## When to create a new factory

Only after confirming none of the above (or anything in the local `fields.ts`) serves the purpose. Follow `protocols/factory-function-pattern.md`.
