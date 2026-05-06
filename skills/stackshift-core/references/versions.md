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
| 0.1.9 (incl. 0.1.9A sync) | ≥0.1.9 | `paired-mode-contract` recommended; `claude-design-handoff` (`--handoff <url>`, `+CLAUDE_DESIGN`, `/forge-export-design`) and `auto-verify-hook` (`verify.js` single-arg + `// @contract` directive) optional. Skill-root resolution delegates to UI Forge `scripts/detect.sh`. Bootstrap captures and surfaces UI Forge's scan-fallback banner. Optional `_paired` mirror block in `design-arch.json`. |
| 0.2.1 – 0.2.2 | ≥0.2.7 | Paired-mode named export fix (0.2.7A) — `export { ComponentName }` no longer flagged as violation. `design/standards/` auto-created by `scan.js` (0.2.7). `--mode body-only` FORGE NOTES placement spec fixed (0.2.7B). UTF-8 stdout fix for Windows redirects (0.2.7C). Next.js + Sanity image standard in UI Forge `references/standards/nextjs-image.md` (0.2.7D). Cross-platform CLI terminology updated (0.2.7E). |

**Runtime check:** During bootstrap (Step 6e of `bootstrap/install.md`), StackShift reads `ui-forge`'s `skill.version` and compares against this table. A mismatch emits a non-fatal warning before the first Step 4 handoff.

---

## Variant Router contract version

The `@contract-version` JSDoc tag on every section props interface tracks the Variant Router contract version. Current version: **1.0.0**.

When the Variant Router protocol ships a breaking change, bump this tag in all affected `index.tsx` files — in coordination with UI Forge's `SUPPORTED_CONTRACT_VERSIONS`. UI Forge treats an unrecognised version as a FORGE NOTES warning, not a hard failure.

UI Forge ≥ 0.1.7 ships the `@extragraj/variant-contract` package at `<UI_FORGE>/packages/variant-contract/`. The `compatibility` block in `<UI_FORGE>/packages/variant-contract/contract.schema.json` lists supported StackShift contract versions:

```json
{ "uiForge": ">=0.1.3", "stackshift": ">=0.1.5" }
```

When bumping the contract version, edit **both** this file and `<UI_FORGE>/packages/variant-contract/contract.schema.json` together; document the bump in both repos' change logs. The handshake is documented in detail in `protocols/paired-mode-contract.md`.

See `protocols/variant-router.md` for the canonical pattern.

---

## Allowed and required

- ✅ `getStaticProps` for data fetching
- ✅ `@/*` path alias for imports
- ✅ Optional chaining (`?.`) wherever Sanity data could be null/undefined
- ✅ `@portabletext/react` for rich text rendering
- ✅ `rootSchema()` from `@webriq-pagebuilder/sanity-plugin-schema-default` for section entry files
- ✅ `@stackshift-ui/sheet` and `@stackshift-ui/dialog` for modal overlay wrappers (modal-sheet protocol only; import inside variant files, not index.tsx)
