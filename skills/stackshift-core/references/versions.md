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

## Allowed and required

- ✅ `getStaticProps` for data fetching
- ✅ `@/*` path alias for imports
- ✅ Optional chaining (`?.`) wherever Sanity data could be null/undefined
- ✅ `@portabletext/react` for rich text rendering
- ✅ `rootSchema()` from `@webriq-pagebuilder/sanity-plugin-schema-default` for section entry files
