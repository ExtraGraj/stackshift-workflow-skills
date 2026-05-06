# Step 4 — Component Variant

> **Protocol Discovery for This Step:**
>
> Load protocols from merged registry (project + skill) where `appliesTo` includes Step 4:
> 1. Read `.stackshift/protocol/_registry.json` (if exists)
> 2. Read `protocols/_registry.json` from skill
> 3. Merge registries (project protocols override skill protocols with same ID)
> 4. Filter protocols: `tier === 'required'`
> 5. Load each protocol from `.stackshift/protocol/<id>` (project) OR `protocols/<id>` (skill)
>
> **Required protocols** (load and enforce):
> - Variant Router — `index.tsx` rules: exported props interface, `null` fallback, `?? undefined` extraction
>
> **Optional protocols** that, when active in the merged registry, modify this step:
> - Accessibility — adds `A11Y` sub-block postcondition
> - Brand — adds `BRAND` sub-block postcondition
> - Claude Design Handoff — extends ref-selection rules to allow `--handoff <url>` and adds `CLAUDE_DESIGN` sub-block postcondition
> - Auto-Verify Hook — collapses the manual `validate-contract.js` postcondition into an automatic PostToolUse run
> - Paired-Mode Contract — canonical handshake reference; load when reviewing skill-root resolution, marker fields, or flag refusals

> This is the ONLY step that delegates to `ui-forge`.
> StackShift owns the wiring (index.tsx, props interface, dynamic import).
> `ui-forge` owns the variant body (JSX + component library usage).

Strict sub-step order: **4a → 4b → 4c → 4d**. Do not reorder.

---

## Modification vs. Full Generation

Determine the invocation mode before starting 4a.

| Task type | Mode | Required flags |
|-----------|------|----------------|
| New variant (no stub exists) | full (default) | `--task`, `--refs` |
| Fix or rebuild an existing variant | `--mode body-only` | `--task`, `--refs` (HTML ref required) |
| Append content to an existing body | `--mode body-only` | `--task`, `--refs` |

**FORGE NOTES header and all postcondition checks are required in both modes.** Fix/rebuild tasks are not exempt from structural validation or the contract check.

> **Paired-mode constraints.** UI Forge refuses the following flags when invoked in paired mode (StackShift as caller): `--creative`, `--diff`, `--preview`. The contract-first handoff and these modes are mutually exclusive by design. For iterative regeneration of a completed variant, run UI Forge standalone with `--diff` outside the StackShift workflow — the output path is the only thing that matters, and the result will replace the variant file in place.
>
> See `protocols/paired-mode-contract.md` for the full refusal matrix, modifier composition rules, marker fields, and the contract version handshake.

---

## 4a — Create the empty variant file

```bash
# The file must exist on disk before its dynamic() import can be registered.
touch components/sections/[section-name]/variant_[x].tsx
```

Start with a minimal stub so the file resolves:

```typescript
// variant_[x].tsx
import { MySectionProps } from ".";
export default function MySection_X(_props: MySectionProps) { return null; }
export { MySection_X };
```

→ Proceed to 4b.

---

## 4b — Register the dynamic import in `index.tsx`

```typescript
// components/sections/[section-name]/index.tsx
import dynamic from "next/dynamic";
import { SectionsProps } from "@/types";
import { MySectionComponent as BaseMySectionComponent } from "@stackshift-ui/my-section";

const BaseVariants = {
  variant_a: BaseMySectionComponent,
  variant_b: BaseMySectionComponent,
  variant_c: BaseMySectionComponent,
};

const Variants = {
  ...BaseVariants,
  variant_d: dynamic(() => import("./variant_d")),
  variant_e: dynamic(() => import("./variant_e")),
};
```

If this is a **new section type** (not just a new variant), also register it in `components/list.tsx`:

```typescript
mySection: dynamic(
  () => import("components/sections/my-section").then((m) => m.MySection)
),
```

→ Proceed to 4c.

---

## 4c — Write the props interface and extraction in `index.tsx`

```typescript
/** @contract-version 1.0.0 */
export interface MySectionProps {
  title?: string;
  description?: string;
  primaryButton?: LabeledRouteWithKey;
  // ...one entry per field this section's variants can consume
}

export function MySection({ data }: SectionsProps) {
  const Variant = data?.variant
    ? Variants[data.variant as keyof typeof Variants]
    : undefined;

  const props: MySectionProps = {
    title: data?.variants?.title ?? undefined,
    description: data?.variants?.description ?? undefined,
    primaryButton: data?.variants?.primaryButton ?? undefined,
  };

  if (!Variant) return null;     // ← no hardcoded fallback variant

  return <Variant {...props} />;
}

export default MySection;
```

**Hard rules:**
- Function signature is `{ data }: SectionsProps` — not a custom props type.
- Every field uses `?? undefined`.
- Render `null` when `data?.variant` is absent. **Never** hardcode a fallback.

See `protocols/variant-router.md` for the full pattern.

→ Proceed to 4d.

---

## 4d — Fill the variant body (INVOKE `ui-forge`)

Steps 4a–4c are complete. The props interface is exported from `"."`. Before invoking `ui-forge`, verify every precondition, execute the invocation, then validate postconditions.

### Preconditions

All of the following must be true before calling `ui-forge`. If any check fails, halt and fix before proceeding.

- [ ] `components/sections/<name>/index.tsx` exists and exports the props interface
- [ ] `components/sections/<name>/<Variant>.tsx` exists as a stub file (scaffolded in 4a)
- [ ] `types.ts` contains the props interface for this variant (completed in Step 3)
- [ ] `design/design-arch.json` exists at project root — **if missing, run `ui-forge`'s `scan.js` first** (see "Missing `design-arch.json`" in Failure Modes below)
- [ ] `design/design-arch.json` `.designStandards` includes a reference to the materialized `variant-router` protocol (written by bootstrap — see `bootstrap/install.md`)

### Anti-Slop Fidelity Check

**Run this check when any `--refs` file is an HTML or TSX file.** Before writing output, confirm each point from the reference HTML/TSX:

- [ ] Padding/margin values — map to exact Tailwind equivalents; do not approximate
- [ ] Background — dark (`bg-foreground`) vs. light (`bg-background`); verify which applies
- [ ] Decorative elements — patterns, overlays, watermarks — confirm present or absent in reference
- [ ] Icon container — size, background colour, border-radius match reference exactly
- [ ] Button/CTA style — underline, filled, or outlined; match reference exactly

Report each finding in the FORGE NOTES block before writing TSX.

---

### `${UI_FORGE_SKILL_DIR}` Resolution

**Preferred path (UI Forge ≥ 0.1.9):** invoke `sh <candidate>/scripts/detect.sh` against the candidate paths below. The first that succeeds prints the absolute skill root to stdout — capture it as `UI_FORGE_SKILL_DIR`. UI Forge's `detect.sh` is the upstream source of truth for the search order; delegating to it keeps StackShift in sync with future install-location changes.

```bash
# Try detect.sh first
for candidate in \
  ".claude/skills/ui-forge" \
  ".agents/skills/ui-forge" \
  ".codex/skills/ui-forge" \
  "$HOME/.claude/skills/ui-forge" \
  "$HOME/.agents/skills/ui-forge" \
  "$HOME/.codex/skills/ui-forge"; do
  if [ -x "$candidate/scripts/detect.sh" ]; then
    UI_FORGE_SKILL_DIR="$(sh "$candidate/scripts/detect.sh")" && break
  fi
done
```

**Fallback (UI Forge < 0.1.9 or `detect.sh` missing):** use the **first path that exists** from this list:

1. Environment variable `UI_FORGE_SKILL_DIR` if set
2. `.claude/skills/ui-forge/` (project-scope Claude Code install)
3. `.agents/skills/ui-forge/` (project-scope agents install)
4. `.codex/skills/ui-forge/` (legacy — pre-0.1.9A Codex CLI install)
5. `~/.claude/skills/ui-forge/` (global Claude Code install)
6. `~/.agents/skills/ui-forge/` (global agents install)
7. `~/.codex/skills/ui-forge/` (legacy — pre-0.1.9A global Codex CLI install)

The fallback list is the same one referenced in `protocols/paired-mode-contract.md`.

**If none resolve:** halt Step 4 with a clear error:

```
⚠️ ui-forge skill not found.

Step 4 requires the ui-forge companion skill to generate variant bodies.
StackShift never authors component code directly.

Install ui-forge:
  Claude Code:      npx skills add extragraj/ui-forge -a claude-code
  Universal agents: npx skills add extragraj/ui-forge -a agents

Then re-run Step 4.
```

Do **not** attempt to author component bodies without `ui-forge`. This violates the interface boundary.

### Pre-flight — 4d.1 (`--validate-input`)

Before the main invocation, run the input validator:

```bash
node ${UI_FORGE_SKILL_DIR}/scripts/invoke.js \
  --validate-input \
  --signal CONVERT_VARIANT \
  --refs <path-to-types.ts>
```

**On success:** UI Forge prints `ui-forge: input validation passed — interface: <Name> (<path>)`. Log it and continue to the main invocation.

**On failure (exit ≠ 0):** Present stderr verbatim. Halt Step 4. Do not proceed to the main invocation — the contract file itself needs fixing before generation can succeed.

This check confirms the props interface is well-formed and its name can be extracted before spending a full generation on a malformed handoff.

### Invocation

Two invocation paths are supported. Choose based on runtime.

**Slash Commands / Agentic CLI (preferred — Claude Code, AntiGravity, or any agentic platform with `.claude/` directory):**

```
/forge --task "Generate body for <VariantName> variant of <SectionName> section. \
               Conform to the props interface in <types-path>. Do not modify index.tsx \
               or the props interface. Write variant body only." \
       --refs <path-to-types.ts>,<path-to-initialValue-dir>,<path-to-variant-thumbnail> \
       --output components/sections/<name>/<Variant>.tsx \
       --mode body-only \
       --signal CONVERT_VARIANT
```

The slash command routes through `$CLAUDE_PLUGIN_ROOT` and is equivalent to the bash form below. Requires UI Forge ≥ 0.1.9.

**Universal agent invocation (all platforms, or UI Forge < 0.1.9):**

```bash
node ${UI_FORGE_SKILL_DIR}/scripts/invoke.js \
  --task "Generate body for <VariantName> variant of <SectionName> section. \
          Conform to the props interface in <types-path>. Do not modify index.tsx \
          or the props interface. Write variant body only." \
  --refs <path-to-types.ts>,<path-to-initialValue-dir>,<path-to-variant-thumbnail> \
  --output components/sections/<name>/<Variant>.tsx \
  --mode body-only \
  --signal CONVERT_VARIANT
```

**Claude Design handoff variant** — when the `claude-design-handoff` protocol is active, the layout source can be a Claude Design URL instead of an HTML/TSX file. `--task` may be omitted (UI Forge derives it from the handoff README heading):

```
/forge --handoff <claude-design-url> \
       --refs <path-to-types.ts> \
       --output components/sections/<name>/<Variant>.tsx \
       --mode body-only \
       --signal CONVERT_VARIANT
```

See `protocols/claude-design-handoff.md` and `references/claude-design-roundtrip.md`.

**Ref-selection rules:**

| Ref type | Include? | Why |
|----------|----------|-----|
| `.ts`/`.tsx` file containing the exported props interface | **Required** | Contract that `ui-forge` must conform to |
| `initialValue/` directory contents | **Recommended** | Gives `ui-forge` realistic placeholder copy |
| `images/<variant>.png` thumbnail | **Recommended** | Vision-based layout hints if present — must be passed as `--refs path/to/image.png`; do not rely on AI vision context alone. The `+IMAGE` modifier only fires when an image file appears in `--refs`. |
| Claude Design handoff URL via `--handoff <url>` | **Permitted** when `claude-design-handoff` protocol is active | Layout authority — handoff wins for visual spec; `design-arch.json` wins for tokens. Mutually exclusive with HTML/TSX layout refs. |
| Section schema file | **Never** | StackShift territory — confuses signal detection |
| GROQ query file (`pages/api/query.ts`) | **Never** | StackShift territory — confuses signal detection |
| `index.tsx` | **Never** | StackShift territory — `ui-forge` must not modify wiring |

**`ui-forge` must honor these StackShift-specific rules** (include them in the invocation context if not obvious from design-arch):

```typescript
// variant_[x].tsx
import { MySectionProps } from ".";                  // ← always from "."

export default function MySection_X({
  title,
  description,
  optionalProp = "default",                           // ← defaults in destructure
}: MySectionProps) {
  return (
    <Section>
      {title ? <Heading title={title} /> : null}     {/* ← ternary, not && */}
    </Section>
  );
}

export { MySection_X };                               // ← named export after default

function Heading({ title }: { title: string }) {     // ← helpers below all exports
  return <h2>{title}</h2>;
}
```

### Postconditions

Run these checks **after** `ui-forge` returns. All must pass.

**Structural (validator-driven):**
- [ ] Run `node ${UI_FORGE_SKILL_DIR}/scripts/validate-contract.js <output-variant-file> <path-to-types.ts>` — must exit 0. This covers: exports present, contract imported, `?? null` / `?? undefined` usage, no extra files, props interface unchanged.

> **When the `auto-verify-hook` protocol is active**, the PostToolUse hook fires automatically on the variant write and runs UI Forge's `verify.js` (which delegates to `validate.js` from `@extragraj/variant-contract`). The structural postcondition becomes "hook exit code 0" — no separate command. The manual `validate-contract.js` invocation remains valid as a backup or for non-Claude-Code runtimes. See `protocols/auto-verify-hook.md`.

**StackShift-specific (manual):**
- [ ] `// FORGE NOTES` header is present:
  - **Full mode (default):** file begins with `// FORGE NOTES`
  - **Body-only mode (`--mode body-only`):** `// FORGE NOTES` appears immediately after the last import statement (UI Forge ≥ 0.2.7B)
- [ ] `// @contract <path-to-types.ts>` directive present on line 3 of FORGE NOTES (UI Forge ≥ 0.1.9 — required by `SIGNAL_VARIANT`; consumed by the auto-verify hook to resolve the contract path)
- [ ] `index.tsx` is bytewise unchanged (diff against git if possible)
- [ ] No new files written outside `components/sections/<name>/`

**Accessibility (when `accessibility` protocol is active):**
- [ ] `// FORGE NOTES` header contains an `A11Y` sub-block

**Brand (when `brand` protocol is active):**
- [ ] `// FORGE NOTES` header contains a `BRAND` sub-block

**Claude Design (when `claude-design-handoff` protocol is active and `--handoff` was used):**
- [ ] `// FORGE NOTES` header contains a `CLAUDE_DESIGN` sub-block documenting source URL, task summary, and token remappings
- [ ] No tokens from the handoff appear inline in the generated TSX (every color/spacing value resolves to a `design-arch.json` token name)

If any postcondition fails, follow the Failure Modes protocol below.

---

## Failure Modes

If `ui-forge` fails or produces non-compliant output, follow the deterministic response for each case. **No failure mode results in silent corruption of StackShift-managed files.**

The `Checker` column identifies whether detection and response are owned by UI Forge's tooling or by StackShift's boundary checks.

| Failure | Checker | Detection | Response |
|---|---|---|---|
| Malformed props interface | UI Forge (`--validate-input`) | Pre-flight exit ≠ 0 | Present stderr verbatim. Halt. Fix the contract file before retrying. Do not proceed to main invocation. |
| Contract violation | UI Forge (`validate-contract.js` or auto-verify hook) | Post-gen exit ≠ 0 | Present stderr verbatim. Halt Step 4. Present the full violation list. Do not auto-fix. |
| Missing `design-arch.json` | UI Forge (stderr) | Stderr matches `design-arch.json not found` or file absent at precondition check | Run `node ${UI_FORGE_SKILL_DIR}/scripts/scan.js`, then retry invocation **once**. If it fails again, halt. |
| Missing `FORGE NOTES` header | StackShift | File does not begin with `// FORGE NOTES` | Re-invoke with explicit `--task` addendum: "Output MUST begin with `// FORGE NOTES` block." **Max 1 retry.** If second attempt also fails, present output to user and halt. |
| Missing `// @contract` directive | StackShift | Auto-verify hook stderr note "no @contract directive" (when `auto-verify-hook` protocol active) | Re-invoke with `--task` addendum: "FORGE NOTES MUST include `// @contract <path>` on line 3." Max 1 retry. |
| Claude Design handoff fetch failed | UI Forge (`fetch-handoff.js` stderr) | Non-zero exit from fetch sub-process; stderr shows 401/403/timeout | Present stderr verbatim. Halt. Re-export the handoff URL from Claude Design and retry. Do not retry automatically. |
| Missing `CLAUDE_DESIGN` sub-block | StackShift | `--handoff` used but FORGE NOTES lacks `CLAUDE_DESIGN` block (when `claude-design-handoff` protocol active) | Likely classification miss — confirm `--handoff` reached `invoke.js`. Re-invoke with explicit ref under `design/.handoff-cache/`. Max 1 retry. |
| `index.tsx` modified | StackShift | Bytewise diff shows change | Restore from git (`git checkout -- components/sections/<name>/index.tsx`) if available, otherwise present diff and halt. |
| Unexpected file written | StackShift | Post-run file listing of `components/sections/<name>/` and `design/` (excluding `design/.handoff-cache/` when handoff is active) | Delete the unexpected file, halt, instruct user that signal detection misfired and `ui-forge` was invoked with an incorrect signal. |
| `ui-forge` non-zero exit | UI Forge | Process exit code ≠ 0 | Capture stderr, present to user verbatim, halt Step 4. Do not retry automatically. |

**Recovery rule:** After any halt, the user must explicitly confirm before Step 4 re-runs. Do not auto-retry beyond the limits specified above.

---

## Done when

- [ ] `variant_[x].tsx` created (4a)
- [ ] `dynamic()` import registered in `index.tsx` (4b)
- [ ] If new section: registered in `components/list.tsx`
- [ ] Props interface defined and exported from `index.tsx` (4c)
- [ ] Props extracted with `?? undefined` for every field (4c)
- [ ] No hardcoded fallback variant (4c)
- [ ] All preconditions verified before `ui-forge` invocation (4d)
- [ ] Variant body generated via `ui-forge` with `CONVERT_VARIANT` signal (4d)
- [ ] All postconditions passed (4d)
- [ ] No StackShift-managed files modified by `ui-forge` (4d)

→ Proceed to `workflow/5-groq.md`.
