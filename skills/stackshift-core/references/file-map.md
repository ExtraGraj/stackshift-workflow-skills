# Reference — File Map

Quick lookup: which file does what in a StackShift project.

| File | Purpose |
|---|---|
| `schemas/custom/sanity-plugin-schema-default/src/schemas/common/fields.ts` | Local field factory overrides — check here first |
| `node_modules/@webriq-pagebuilder/sanity-plugin-schema-default/src/schemas/common/fields.ts` | Base field factories — check here second |
| `schemas/elements/` | Global registered types (e.g. `conditionalLink`) — registered once, referenced by name |
| `schemas/elements/index.ts` | Exports for global registered types |
| `schemas/custom/index.ts` | Custom schema package imports — configured during one-time setup |
| `schemas/schema.ts` | Root schema merge — configured once during one-time setup |
| `schemas/custom/.../sections/index.ts` | Section registry — import and spread each new section here |
| `schemas/custom/.../sections/[name]/[name].ts` | Section entry — wires `rootSchema()`, `variantsList`, field schema |
| `schemas/custom/.../sections/[name]/schema/index.ts` | Field definitions with `hideIfVariantIn()` per variant |
| `schemas/custom/.../sections/[name]/initialValue/` | Placeholder content for every field |
| `schemas/custom/.../sections/[name]/images/` | Variant preview thumbnails — one per variant |
| `pages/api/query.ts` | All GROQ projections — reusable fragment constants and `variants` query |
| `types.ts` | All TypeScript interfaces — check and add here |
| `components/sections/[name]/index.tsx` | Variant router + local props interface + props extraction |
| `components/sections/[name]/variant_[x].tsx` | Custom variant implementation |
| `components/list.tsx` | Section component registry — register new section types here |
