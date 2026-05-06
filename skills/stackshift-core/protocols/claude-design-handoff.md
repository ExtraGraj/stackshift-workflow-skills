# Protocol — Claude Design Handoff (`SIGNAL_CLAUDE_DESIGN`)

**Tier:** optional
**Applies to:** Step 4 (Component Variant)

When this protocol is installed, Step 4 may use a Claude Design handoff URL as the layout source for variant generation. UI Forge fetches the handoff, materializes refs into `design/.handoff-cache/`, and remaps tokens to `design/design-arch.json`. The `+CLAUDE_DESIGN` modifier is composed automatically — no per-invocation flag is needed beyond `--handoff <url>`.

**StackShift owns activation and ref-rule extension. UI Forge owns fetch, token remapping, and FORGE NOTES enforcement.**

---

## When to use this protocol

Install this protocol when your team designs sections in Claude Design (`claude.ai/design`) and wants the handoff URL to be a first-class input to Step 4. Skip it if all section layouts are authored as HTML/TSX/images directly in the repo.

The protocol does not lock you in — even when installed, ordinary HTML/TSX layout refs continue to work. `--handoff <url>` is an additional source, not a replacement.

---

## Round-trip workflow

```
/forge-scan                                           # 1. scan project → design/design-arch.json
/forge-export-design                                  # 2. export → design/claude-design-bundle/
# 3. upload bundle to Claude Design (drag-drop or paste README.md)
# 4. design the section in Claude Design using project tokens
# 5. export the handoff URL from Claude Design
# 6. invoke Step 4 with --handoff (see below)
```

See `references/claude-design-roundtrip.md` for the detailed walkthrough.

---

## Step 4 integration

When this protocol is active, Step 4d's ref-selection rules gain one row:

| Ref type | Include? | Why |
|----------|----------|-----|
| Claude Design handoff URL via `--handoff <url>` | **Permitted** | Layout authority — handoff wins for visual spec; `design-arch.json` wins for tokens |

`--handoff <url>` is **mutually exclusive** with HTML/TSX layout refs. If you need a hybrid (handoff + extra HTML), pass the handoff URL plus `--refs ./extra.html` — UI Forge will surface both, but the handoff is treated as primary layout authority.

### Invocation (Claude Code)

```
/forge --handoff <url> --refs <path-to-types.ts> --output components/sections/<name>/<Variant>.tsx --signal CONVERT_VARIANT --mode body-only
```

`--task` may be omitted — UI Forge derives it from the handoff README heading when absent.

### Invocation (general agents)

```bash
node ${UI_FORGE_SKILL_DIR}/scripts/invoke.js \
  --handoff <url> \
  --refs <path-to-types.ts> \
  --output components/sections/<name>/<Variant>.tsx \
  --signal CONVERT_VARIANT \
  --mode body-only
```

---

## Postcondition (when this protocol is active)

- [ ] `// FORGE NOTES` header contains a `CLAUDE_DESIGN` sub-block documenting source URL, task summary, and token remappings.

If the sub-block is absent after generation, halt Step 4. The handoff was likely not classified as `+CLAUDE_DESIGN` — confirm the `--handoff` flag reached `invoke.js` or that the ref path is under `design/.handoff-cache/`.

---

## Paired-mode behavior

`+CLAUDE_DESIGN` is **compatible** with paired mode. UI Forge does not refuse it. It composes cleanly with `+A11Y` (accessibility protocol) and `+BRAND` (brand protocol) — all three modifiers can stack.

It is **incompatible** with `+CREATIVE` and `+DIFF`, but those are already refused under paired mode for unrelated reasons. See `paired-mode-contract.md` for the full refusal matrix.

---

## Bootstrap behavior

When this protocol is in the materialized set:

1. Bootstrap appends `design/.handoff-cache/` and `design/claude-design-bundle/` to the default `.forgeignore` (Step 8).
2. Bootstrap offers to run `/forge-export-design` (or `node ${UI_FORGE_SKILL_DIR}/scripts/export-design.js`) immediately after the `design-arch.json` bridge completes — this pre-seeds Claude Design with project tokens before any handoff is created.

---

## Activation

Selected during bootstrap (optional — unchecked by default in interactive mode).

To add after initial bootstrap:
1. Append the registry entry to `.stackshift/protocol/_registry.json` (`tier: "optional"`, `file: "claude-design-handoff.md"`).
2. Copy `protocols/claude-design-handoff.md` from the skill bundle to `.stackshift/protocol/`.
3. Run `/forge-export-design` once to produce the upload bundle.

Requires UI Forge ≥ 0.1.9. Older UI Forge versions do not understand `--handoff`.

---

## See also

- `references/claude-design-roundtrip.md` — full six-step round-trip workflow
- `paired-mode-contract.md` — flag refusal matrix and modifier composition
- UI Forge `references/claude-design-handoff-format.md` — URL/manifest shape
