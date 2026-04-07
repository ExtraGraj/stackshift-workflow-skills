# Protocol — One-Time Custom Schema Setup

**Applies to:** Step 2 (Section Schema) — **run ONCE per project**
**Rule strength:** Required (but only once)

Only follow these steps if custom local variants have not yet been configured in the project. If already configured, skip this protocol forever.

---

## Step 1 — Configure custom schema imports

Edit `schemas/custom/index.ts`:

```typescript
import { default as customSchemaBlog } from "./sanity-plugin-schema-blog/src";
import { default as customSchemaDefault } from "./sanity-plugin-schema-default/src/schemas/sections";
import { default as customSchemaCommerce } from "./sanity-plugin-schema-commerce/src/schemas/sections";

const schemas = {
  ...customSchemaBlog,
  ...customSchemaDefault,
  ...customSchemaCommerce,
};
export default schemas;
```

Add a new schema package here **only** when creating a new section category.

---

## Step 2 — Uncomment schema configuration in the main schema file

Edit `schemas/schema.ts`:

```typescript
// 1. Uncomment:
import customSchema from "./custom";
const updatedSchemaArray = Object.values(customSchema);

const allSchemas = (() => {
  // 2. Comment out:
  // const mergedSchemas = mergeReplaceAndAdd(baseSchemas, commerceSchemaArray);

  // 3. Uncomment:
  const mergedSchemas = mergeReplaceAndAdd(baseSchemas, updatedSchemaArray);
  return mergedSchemas;
})();
```

---

## Step 3 — Verify the schema merge

If sections don't appear in Studio, check:

- ✅ Custom schema imports exist in `schemas/custom/index.ts`
- ✅ Import is uncommented in `schemas/schema.ts`
- ✅ `mergeReplaceAndAdd()` uses `updatedSchemaArray`, not `commerceSchemaArray`
