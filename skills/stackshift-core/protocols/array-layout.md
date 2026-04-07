# Protocol — Array Layout Conventions

**Applies to:** Step 1 (Schema Fields)
**Tier:** Recommended
**Rule strength:** Quality — no errors if omitted, but Sanity Studio UX suffers.

Sanity arrays accept a `layout` option that changes how authors interact with them. Pick the right layout for the content type.

---

## Layout table

| Array content | `options` | When to use |
|---|---|---|
| Primarily images | `{ layout: "grid" }` | `arrayOfImages`, galleries, logo walls |
| String tags / keywords | `{ layout: "tags" }` | `tags`, `arrayOfText` used as tag input |
| Collapsible nav / routes / buttons | `{ collapsible: true, collapsed: true }` | `routes`, nav links, button arrays |
| Object items (features, FAQs, etc.) | *(omit — default list view)* | Most object arrays |

---

## Examples

**Image grid:**
```typescript
{
  name: "gallery",
  type: "array",
  of: [{ type: "object", ... }],
  options: { layout: "grid" },
}
```

**Tag input:**
```typescript
{
  name: "keywords",
  type: "array",
  of: [{ type: "string" }],
  options: { layout: "tags" },
}
```

**Collapsible routes:**
```typescript
{
  name: "routes",
  type: "array",
  of: [{ type: "conditionalLink" }],
  options: { collapsible: true, collapsed: true },
}
```

---

## Why it matters

- Grid layout makes image arrays scannable for content authors.
- Tags layout turns a tedious "add item → type → save" flow into type-and-enter.
- Collapsible navs keep long lists from dominating the Studio form.

None of these cause build or runtime errors if omitted — but the Studio experience degrades noticeably.
