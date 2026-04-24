# Reference — Version Matrix

| Technology | Version | Notes |
|---|---|---|
| Sanity | v3.17 | **Strict — do not use v4+ APIs** (`defineConfig`, etc.) |
| Next.js | 14 | **Pages Router only** — `getStaticProps`, not App Router |
| TypeScript | Strict mode | **No `any` types** |
| `@webriq-pagebuilder/sanity-plugin-schema-default` | Base package | Extend, don't replace |
| `@portabletext/react` | Current | Replaces deprecated `@sanity/block-content-to-react` |

---

## Forbidden APIs and patterns

- ❌ Sanity v4+ `defineConfig`, `defineType`, `defineField` (inside field factories — plain objects only)
- ❌ Next.js App Router (`app/` directory, `'use client'`, server components)
- ❌ `@sanity/block-content-to-react` — replaced by `@portabletext/react`
- ❌ `any` types — use `unknown` + narrowing
- ❌ Inline GROQ outside `pages/api/query.ts`

---

## Companion Skill: ui-forge

| StackShift version | ui-forge version range | Notes |
|---|---|---|
| 0.1.5 — 0.1.7 | ≥0.1.1, <0.2.0 | Requires `CONVERT_VARIANT` signal (ui-forge ≥0.1.2) |
| 0.1.8 | ≥0.1.8 | `SIGNAL_A11Y` via `a11yRequired` marker, `SIGNAL_BRAND` via `designStandards.brand`, pre-flight `--validate-input`, postcondition `validate-contract.js`. |

**Runtime check:** During bootstrap (Step 6e of `bootstrap/install.md`), StackShift reads `ui-forge`'s `skill.version` and compares against this table. A mismatch emits a non-fatal warning before the first Step 4 handoff.

---

## Variant Router contract version

The `@contract-version` JSDoc tag on every section props interface tracks the Variant Router contract version. Current version: **1.0.0**.

When the Variant Router protocol ships a breaking change, bump this tag in all affected `index.tsx` files — in coordination with UI Forge's `SUPPORTED_CONTRACT_VERSIONS`. UI Forge treats an unrecognised version as a FORGE NOTES warning, not a hard failure.

See `protocols/variant-router.md` for the canonical pattern.

---

## Allowed and required

- ✅ `getStaticProps` for data fetching
- ✅ `@/*` path alias for imports
- ✅ Optional chaining (`?.`) wherever Sanity data could be null/undefined
- ✅ `@portabletext/react` for rich text rendering
- ✅ `rootSchema()` from `@webriq-pagebuilder/sanity-plugin-schema-default` for section entry files
