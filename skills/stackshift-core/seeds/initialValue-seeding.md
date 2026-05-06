# Seed Strategy — Initial-Value (UI-Level Pre-fill)

**Applies to:** Step 2 (Section Schema), `initialValue/` only
**Automation level:** Semi-automated — agent extracts text; editors upload images manually

> **Only one seeding strategy should be active at a time.**
> Check `.stackshift/installed.json` → `seed` field to confirm this is the active strategy.
> Run `npx @extragraj/stackshift-skills repair` to resolve conflicts.

---

## When to use

Load this strategy when:
- Writing or updating `initialValue/index.ts` or per-variant `initialValue/variant_x.ts`
- The user provides an HTML mockup, a hardcoded component, or a hardcoded data object to convert

---

## Scope rule — existing variant conversion

> When the user requests converting a hardcoded HTML component or hardcoded data into an
> **existing variant**, ONLY modify `initialValue/index.ts`.
> Do NOT run the full Section Variant & Field Creation Workflow.
> No schema field changes, no GROQ updates, no TypeScript type changes, no new variant
> registration — unless the variant itself is new.

---

## How to execute

**Step 0 — Identify all seeding sources before writing:**

Before writing any `initialValue` entry:

1. **READ** the reference HTML/component/file if provided. Do not proceed from memory.
   - Identify every visible text string, label, button copy, and list item.
   - Note the structural shape (which fields are arrays, which are rich text, which are strings).

2. **CHECK** for a co-located data or config file:
   - Look for: `data/<section>.ts`, `config/<section>.ts`, `_data.ts`, or `<section>.data.ts`
     alongside the schema or component file.
   - If found, read it. Use its values as the primary seed source — it was authored for this purpose.
   - If a data file and reference HTML both exist, the data file takes precedence for field values.

3. **ONLY if no reference or data file exists:** use generic-but-realistic placeholder text
   (never Lorem ipsum).

**Steps 1–4 — Write the output:**

1. **Extract ALL text** from the HTML or hardcoded component: headings, body copy, button
   labels, link text, list items, form labels, etc.
2. **Map each piece** to its corresponding field name in `schema/index.ts`.
3. **Write `initialValue/index.ts`** (or per-variant files) with the extracted values.
4. **Verify** every field in `schema/index.ts` has a corresponding entry.

---

## Complete file example

Use this as the canonical reference when no existing `initialValue/` files are present in the project.

```typescript
// initialValue/index.ts — canonical structure
import {
  defaultArrayOfObjects,
  defaultBlockContent,
  defaultButton,
} from "@webriq-pagebuilder/sanity-plugin-schema-default";

export default {
  // Simple string fields — use extracted text verbatim
  subtitle: "Extracted subtitle text",
  title: "Extracted heading",

  // Portable Text — ALWAYS wrap in defaultBlockContent
  // Supports inline marks (strong, em) and list items (listItem: "bullet" | "checkList")
  description: defaultBlockContent([
    {
      _type: "block",
      style: "normal",
      children: [
        { _type: "span", text: "Extracted paragraph text. " },
        { _type: "span", marks: ["strong"], text: "Bold portion of text." },
      ],
    },
    {
      _type: "block",
      style: "normal",
      listItem: "checkList",
      level: 1,
      children: [{ _type: "span", text: "First checklist item" }],
    },
    {
      _type: "block",
      style: "normal",
      listItem: "checkList",
      level: 1,
      children: [{ _type: "span", text: "Second checklist item" }],
    },
  ]),

  // Button/CTA — ALWAYS use defaultButton helper with the extracted label
  primaryButton: defaultButton("Extracted button label"),

  // Simple string array — no helper needed
  bulletItems: [
    "First bullet item",
    "Second bullet item",
    "Third bullet item",
  ],

  // Array of objects — ALWAYS use defaultArrayOfObjects
  // Each item's _type must match the schema's array item type
  cards: defaultArrayOfObjects([
    {
      _type: "object",
      title: "First card heading",
      description: "First card body text extracted from source.",
    },
    {
      _type: "object",
      title: "Second card heading",
      description: "Second card body text extracted from source.",
    },
  ]),
};
```

**Helper reference:**

| Helper | When to use |
|--------|-------------|
| `defaultButton(label)` | Any button/CTA field |
| `defaultBlockContent([blocks])` | Any Portable Text / rich text field |
| `defaultArrayOfObjects([items])` | Any array-of-objects field (cards, steps, stat items, etc.) |

---

## Handling complex data

### Rich Text (Portable Text)

Convert HTML `<p>` and `<ul>` tags into the strict Portable Text JSON array format:

```typescript
import { defaultBlockContent } from "@webriq-pagebuilder/sanity-plugin-schema-default";

description: defaultBlockContent([
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text: "Extracted paragraph text here." }],
  },
]),
```

### Images and references

The agent CANNOT pre-fill local image assets or document references without a known
`asset._ref` or `_ref`. **Omit image fields entirely** — editors upload manually.

### Arrays

Include 2–3 realistic items so authors see the repeating pattern.

### conditionalLink placeholders

Use `linkType: "linkExternal"` with `linkExternal: "#"` as the safe default.

---

## Text conventions

- If a reference HTML or data file is provided, its literal content is mandatory —
  do not substitute or paraphrase.
- Consult config/data files before any reference HTML; they are the authoritative seed source.
- Use the extracted content verbatim — do not invent or substitute "Lorem ipsum"
- Button labels: use the exact label from the source HTML/component
- Array items: make each one distinct and realistic, not "Item 1 / Item 2"
