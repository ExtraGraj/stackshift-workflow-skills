# Protocol — Paired-Mode Contract

**Tier:** recommended
**Applies to:** Step 4 (Component Variant), Bootstrap (Step 6)

The single canonical reference for the StackShift ↔ UI Forge handshake. Other paired protocols (`accessibility`, `brand`, `claude-design-handoff`, `auto-verify-hook`, `variant-router`) link to this document instead of restating its rules.

**This protocol does not introduce behavior.** It documents the invariants that already govern the boundary between the two skills, in one place, so changes to the contract are reviewable atomically.

---

## What "paired mode" means

Paired mode is detected by UI Forge when `.stackshift/installed.json` exists in the project root. UI Forge surfaces it in `CONVERT_VARIANT` output as `PAIRED: stackshift x.y.z`. While paired:

- StackShift owns: schema, types, `index.tsx` wiring, `Variants` map, props interface, GROQ.
- UI Forge owns: variant body (JSX, classNames, library swaps, FORGE NOTES content).
- Neither skill writes into the other's territory.

### Named export exception (UI Forge ≥ 0.2.7A)

The Variant Router contract requires every variant file to end with a named re-export:

```typescript
export { MySection_X };
```

Prior to UI Forge 0.2.7A, `validate-contract.js` flagged this as a violation (extra named export). From 0.2.7A onward, `validate-contract.js` auto-detects `.stackshift/installed.json` and exempts exactly one named export that matches the default export name. In non-paired mode, named exports remain forbidden.

This is a behaviorally correct outcome — no StackShift changes are needed. This section exists so the rule is auditable in one place.

---

## Skill-root resolution (`${UI_FORGE_SKILL_DIR}`)

Both bootstrap and Step 4 need to invoke UI Forge scripts. The canonical resolution is:

1. **Prefer `detect.sh`** (UI Forge ≥ 0.1.9): run `sh <candidate>/scripts/detect.sh` against each candidate path below; the first that succeeds prints the absolute skill root to stdout.
2. **Fallback list** (used when `detect.sh` is missing on older UI Forge installs):

| Order | Path |
|---|---|
| 1 | `$UI_FORGE_SKILL_DIR` env var if set |
| 2 | `.claude/skills/ui-forge/` (project-scope Claude Code) |
| 3 | `.agents/skills/ui-forge/` (project-scope agents) |
| 4 | `.codex/skills/ui-forge/` (legacy — pre-0.1.9A Codex CLI install) |
| 5 | `~/.claude/skills/ui-forge/` (global Claude Code) |
| 6 | `~/.agents/skills/ui-forge/` (global agents) |
| 7 | `~/.codex/skills/ui-forge/` (legacy — pre-0.1.9A global Codex CLI install) |

If none resolve, halt with the install instructions documented in `workflow/4-variants.md`.

---

## Marker fields

Two files mediate the handshake. Each field has a single owner — never both.

### `.stackshift/installed.json` — StackShift-owned

| Field | Written by | Consumed by | Purpose |
|---|---|---|---|
| `skillVersion` | CLI + bootstrap | UI Forge (paired-mode banner) | Surfaces in `PAIRED:` line |
| `protocols` | CLI + bootstrap | (informational) | Materialized set |
| `a11yRequired` | bootstrap (when `accessibility` selected) | UI Forge `detectSignals()` | Triggers `+A11Y` |
| `pendingDesignArchBridge` | bootstrap (when arch absent) | bootstrap (next run) | Deferred bridge payload |
| `uiForgeIntegration` | bootstrap (Step 6d) | bootstrap (next run) | Detection state cache |

### `design/design-arch.json` — UI Forge-owned

| Field | Written by | Consumed by | Purpose |
|---|---|---|---|
| `componentLib`, `usedComponents`, `usedLibraries`, `tailwind.*`, `globalCss`, `patterns.*` | UI Forge `scan.js` | UI Forge `invoke.js` | Project authority |
| `designStandards.stackshiftVariantRouter` | bootstrap (Step 6a) | UI Forge `loadDesignStandards()` | Variant Router rules |
| `designStandards.stackshiftComponentStandard` | bootstrap (Step 6a) | UI Forge `loadDesignStandards()` | Component conventions |
| `designStandards.brand` | bootstrap (when `brand` selected) | UI Forge `detectSignals()` | Triggers `+BRAND` |

### `_paired` mirror block (optional, additive)

Bootstrap may write a denormalized mirror of relevant StackShift markers into `design/design-arch.json` so UI Forge can read everything from one surface:

```json
{
  "_paired": {
    "stackshiftVersion": "0.1.9",
    "a11yRequired": true,
    "contractVersion": "1.0.0",
    "protocols": ["variant-router", "accessibility"]
  }
}
```

`_paired` is read-only from UI Forge's perspective. The canonical write target is still `.stackshift/installed.json`. Older UI Forge versions ignore unknown top-level keys, so this block is forward-compatible.

---

## Flag refusal matrix (UI Forge under paired mode)

UI Forge refuses these flags when `.stackshift/installed.json` is present:

| Flag | Reason |
|---|---|
| `--creative` | Greenfield generation conflicts with contract-first handoff |
| `--diff` | Surgical edit on existing files conflicts with body-only mode |
| `--preview` | HTML snapshot disabled in paired mode (use Sanity Studio for review) |

Flags that **work** under paired mode:

| Flag | Notes |
|---|---|
| `--handoff <url>` | Composes with `+CLAUDE_DESIGN`. Requires `claude-design-handoff` protocol. |
| `--validate-input` | Pre-flight contract check (Step 4d.1). |
| `--verify` | Adds CONTRACT CHECK requirement to FORGE NOTES. |
| `--a11y` | Redundant when `a11yRequired: true` is set, but harmless. |
| `--rescan` | Re-runs `scan.js` before generation. |

For iterative regeneration of a completed variant with `--diff`, run UI Forge **standalone** (outside Step 4) — the result replaces the variant file in place.

---

## Modifier composition

Multiple modifiers stack. The composition rules:

| Combination | Behavior |
|---|---|
| `+A11Y` + `+BRAND` | Both addenda compose; FORGE NOTES has `A11Y` and `BRAND` sub-blocks |
| `+A11Y` + `+CLAUDE_DESIGN` | Both compose; A11Y rules apply to handoff layout |
| `+BRAND` + `+CLAUDE_DESIGN` | Both compose; brand tokens validated against handoff token remap |
| `+CLAUDE_DESIGN` + `+DIFF` | **Refused** (DIFF is `CONVERT_SECTION` only) |
| `+CLAUDE_DESIGN` + `+CREATIVE` | **Refused** (CREATIVE refused under paired mode anyway) |

---

## Contract version handshake

The Variant Router contract version flows between three locations:

1. **StackShift props interface** — `/** @contract-version 1.0.0 */` JSDoc tag above `export interface SectionProps`. Authoritative source.
2. **UI Forge generated FORGE NOTES** — `// @contract-version 1.0.0` line in the CONTRACT sub-block. Echoed from (1).
3. **UI Forge contract package** — `packages/variant-contract/contract.schema.json` has a `compatibility` field listing supported StackShift contract versions. Bumps require coordinated edits.

Current version: **1.0.0**.

When bumping the contract version:

1. Update `references/versions.md` (StackShift) and the `compatibility` block in `<UI_FORGE>/packages/variant-contract/contract.schema.json` together.
2. Bump the JSDoc tag in every section's `index.tsx` props interface (StackShift territory — done by hand or scripted).
3. Generate a new variant — UI Forge writes the new version into FORGE NOTES.
4. Document the breaking change in both repos' change logs.

UI Forge treats an unrecognised contract version as a FORGE NOTES warning, not a hard failure.

---

## Runtime detection

Paired mode is auto-detected by UI Forge — no flag required. Detection order:

1. UI Forge reads `.stackshift/installed.json` from the project root.
2. If present, UI Forge sets `paired = true` and reads `a11yRequired`, `skillVersion`.
3. The `PAIRED: stackshift <version>` line appears in `CONVERT_VARIANT` stdout.

To run UI Forge in standalone mode against a StackShift project (e.g. for `--diff`), invoke from a different working directory or temporarily rename `.stackshift/`. There is no in-band opt-out flag.

---

## See also

- `accessibility.md`, `brand.md`, `claude-design-handoff.md`, `auto-verify-hook.md` — protocols that depend on this contract
- `variant-router.md` — the contract the props interface implements
- `references/versions.md` — version compatibility matrix
- UI Forge `CLAUDE.md` — paired-mode detection logic
