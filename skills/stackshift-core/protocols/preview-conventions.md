# Protocol — Preview Conventions

**Applies to:** Step 1 (Schema Fields)
**Rule strength:** Required

Every `array` of objects and every standalone `object` field MUST have a `preview` block. `prepare()` must always return a non-empty `title`.

---

## Decision tree

```
Does the array item / object have a mainImage or image field?
  YES → use it as media; fall back to a react-icons icon
  NO  → use a react-icons icon as media (never leave media undefined)
```

---

## Icon fallback table

```typescript
import { BsCardChecklist, BsCardImage, BsCollection, BsTag, BsPerson } from "react-icons/bs";
```

| Item type | Icon |
|---|---|
| Features, FAQs, title+description, general content | `BsCardChecklist` |
| Image arrays, gallery items | `BsCardImage` |
| Portfolio, collection items | `BsCollection` |
| Category, tag items | `BsTag` |
| Person, testimonial, social media, author | `BsPerson` |
| Statistics (no image) | none — use formatted string in title, e.g. `"500+ — Projects Completed"` |

---

## Standard image preview

```typescript
preview: {
  select: {
    title: "title",
    subtitle: "plainText",
    media: "mainImage.image",
  },
  prepare({ title, subtitle, media }: { title: string; subtitle: string; media: any }) {
    return {
      title: title || "Untitled",
      subtitle,
      media: media || BsCardChecklist,
    };
  },
},
```

## Icon-only fallback

```typescript
of: [{
  type: "object",
  icon: BsCardChecklist,
  fields: [...],
  preview: {
    select: { title: "title", subtitle: "description" },
    prepare({ title, subtitle }) {
      return { title: title || "Untitled", subtitle, media: BsCardChecklist };
    },
  },
}],
```

## Simple preview (no `prepare` needed)

```typescript
// Only when there's no media, no subtitle, no fallback
preview: { select: { title: "category" } },
```

---

## Title / subtitle convention

| Available fields | `title` | `subtitle` |
|---|---|---|
| `title` + `description` | `title` | `description` |
| `title` + `plainText` | `title` | `plainText` |
| `title` + `subtitle` | `title` | `subtitle` |
| `label` + `value` | `` `Label: ${label}` `` | `` `Value: ${value}` `` |
| `title` + `tag` + `cardTheme` | `title` | `` `${tag} · ${cardTheme}` `` |
| `category` only | `category` | — |
| `link.label` | `link.label` | — |
| No good string | `"Untitled"` / `"Untitled item"` | — |

Always provide a fallback — never return `undefined` or an empty string for `title`.

---

## Array layout conventions

| Array content | `options` | When |
|---|---|---|
| Primarily images | `{ layout: "grid" }` | `arrayOfImages`, galleries |
| String tags / keywords | `{ layout: "tags" }` | `tags`, tag-style arrays |
| Collapsible nav / routes | `{ collapsible: true, collapsed: true }` | `routes`, button arrays |
| Object items | *(omit)* | Features, FAQs, most object arrays |
