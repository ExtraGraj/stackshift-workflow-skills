# Protocol — Auto-Verify Hook (PostToolUse)

**Tier:** optional
**Applies to:** Step 4 (Component Variant)

When this protocol is installed, bootstrap registers a Claude Code `PostToolUse` hook that runs UI Forge's `verify.js` on every `.tsx` write. The hook fires automatically when a variant file is created or edited; UI Forge's single-arg mode short-circuits silently on non-FORGE files, so the hook is safe to apply project-wide.

**StackShift owns hook installation. UI Forge owns hook execution and contract resolution.**

Requires UI Forge ≥ 0.1.9 (`verify.js` single-arg mode + `// @contract` directive support).

---

## What the hook does

On every `.tsx` write or edit, the hook:

1. Reads the first 30 lines of the written file.
2. Exits silently if the file is not `.tsx`, the file does not exist, or `// FORGE NOTES` is absent.
3. Reads the `// @contract <path>` directive from the FORGE NOTES header (line 3 by convention).
4. Runs the full contract validation (`validate.js`) against that contract.
5. On violation, the hook exit is non-zero and Claude Code surfaces the validator output inline.

The hook never blocks unrelated writes — projects with non-StackShift `.tsx` files (utility components, app shell, etc.) are unaffected.

---

## Step 4 integration

When this protocol is active, Step 4d's postcondition list collapses:

| Postcondition | Without hook | With hook |
|---|---|---|
| Structural validation (`validate-contract.js`) | Manual command after generation | Hook fires automatically on write |
| FORGE NOTES header present | Manual check | Manual check (hook reads but does not enforce header presence) |
| `index.tsx` bytewise unchanged | Manual git diff | Manual git diff |

The hook **complements** the manual `validate-contract.js` step rather than replacing it. Halt criteria are unchanged: any contract violation halts Step 4, whether reported by the hook or by the manual command.

---

## `// @contract` directive

The hook resolves the contract path from a `// @contract <path>` directive on line 3 of FORGE NOTES. UI Forge's `SIGNAL_VARIANT` block already requires this directive; this protocol elevates it from a UI-Forge-internal convention to a StackShift-visible expectation, so reviewers reading only StackShift docs understand why the line exists.

```typescript
// FORGE NOTES
// Signal: CONVERT_VARIANT
// @contract ./components/sections/my-section/index.tsx
//
// Detected: ...
```

If the directive is absent, the hook emits a stderr note and exits 0 — no block, but the structural check is skipped for that file.

---

## Bootstrap behavior

When this protocol is in the materialized set, bootstrap Step 7b writes (or merges into) `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ${UI_FORGE_SKILL_DIR}/scripts/verify.js \"$CLAUDE_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

The write is idempotent — re-running bootstrap detects the existing entry and does not duplicate it. If `.claude/settings.json` exists with unrelated content, the StackShift hook is appended without disturbing user entries.

`${UI_FORGE_SKILL_DIR}` is resolved at hook-write time using the same lookup order documented in `paired-mode-contract.md`.

---

## Opting out per-write

If you need to bypass the hook for a single edit (e.g. an intentional intermediate state), Claude Code supports the `--no-hooks` flag on `/edit` and `/write`. The hook is per-tool, not per-session, so it resumes on the next write.

---

## Activation

Selected during bootstrap (optional — unchecked by default in interactive mode).

To add after initial bootstrap:
1. Append the registry entry to `.stackshift/protocol/_registry.json` (`tier: "optional"`, `file: "auto-verify-hook.md"`).
2. Copy `protocols/auto-verify-hook.md` from the skill bundle to `.stackshift/protocol/`.
3. Add the snippet above to `.claude/settings.json` manually (bootstrap does not retroactively edit settings outside the bootstrap flow).

To remove: delete the StackShift hook entry from `.claude/settings.json`. The protocol stays installed; only the runtime hook is gone.

---

## See also

- `paired-mode-contract.md` — `${UI_FORGE_SKILL_DIR}` resolution
- `variant-router.md` — FORGE NOTES `// @contract` directive context
- UI Forge `references/advanced-usage.md` — Auto-verify hook section (behavior matrix)
