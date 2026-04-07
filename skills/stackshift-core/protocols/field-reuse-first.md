# Protocol — Field Reuse First

**Applies to:** Step 1 (Schema Fields)
**Rule strength:** Required

Before creating any new field in StackShift, verify no existing field already serves the same purpose.

---

## Search order

1. **Local overrides** — `schemas/custom/sanity-plugin-schema-default/src/schemas/common/fields.ts`
2. **Base package** — `node_modules/@webriq-pagebuilder/sanity-plugin-schema-default/src/schemas/common/fields.ts`
3. **Dynamic factories** — many existing factories accept `name`, `title`, `description`, `placeholder`, and similar params. Check these before creating anything new.

If a matching field exists, **reuse it**. Do not duplicate.

---

## Common dynamic factories to consider before creating new

| Factory | Parameters | Best for |
|---|---|---|
| `customText(name, title, desc, placeholder, numberOfInputFields, hidden?)` | full | Any single string field or contact-info array |
| `customInteger(name, title, desc, placeholder, hidden?)` | full | Integer with custom naming |
| `customDropdown(name, title, desc, values[], hidden?)` | full | Dropdown with custom options |
| `arrayOfText(name, title, desc, placeholder, hidden?)` | full | Array of strings |
| `blockContentNormalStyle(name, title, desc, hidden?)` | full | Rich text / block content |
| `arrayOfTitleAndDescription(title, desc, hidden?)` | title/desc | Lists of title+description |
| `arrayOfTitleAndText(title, desc, hidden?)` | title/desc | Lists of title+plainText |
| `arrayOfImageTitleAndText(title, desc, hidden?)` | title/desc | Lists of image+title+text |
| `tags(title?, desc?, hidden?)` | optional | Tag-style string arrays |
| `portfoliosWithCategories(name, title, desc, items, hidden?)` | full | Categorized portfolio arrays |

> Projects often define additional project-specific dynamic factories in the local `fields.ts`. Always inspect the local file first.

---

## Presenting the reuse option

When a reuse candidate exists, present it to the user before writing new code:

> "I found `customText()` which accepts a custom name, title, description, and placeholder. This will cover your new `subtitle` field without adding a new factory. Should I use it, or do you want a dedicated factory?"

Default to reuse unless the user explicitly requests a new definition.
