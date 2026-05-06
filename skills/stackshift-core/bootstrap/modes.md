# Bootstrap — Install Modes

Authoritative definitions of the five install modes offered during bootstrap. Each mode determines which protocols are materialized and whether project infrastructure is created.

---

## None

**Intent:** Evaluate the skill without committing to conventions yet, or use skill defaults exclusively.

**Availability:** AI-agent bootstrap prompt only. Not available via the CLI (`npx @extragraj/stackshift-skills init`). The CLI always writes a bootstrap marker with a selected tier.

**Materialized:**
- Nothing copied to `.stackshift/protocol/`
- No project infrastructure created
- `.stackshift/installed.json` records `mode: "none"` with empty protocol list

**Behavior:**
- Protocols and seeds load from skill only
- Custom protocols not possible (no project registry)
- Workflow functions normally using skill defaults

**Good for:** Experimental projects, pilots, teams evaluating the skill before adoption.

---

## Required

**Intent:** Install only protocols the workflow strictly depends on — those whose violation causes build errors, runtime errors, or schema load failures.

**Materialized:**
- Required protocols → `.stackshift/protocol/`
- Project protocol registry → `.stackshift/protocol/_registry.json` (empty)
- Protocol template → `.stackshift/protocol/_template/`
- References directory → `.stackshift/references/` (empty)

**Not materialized:**
- Seeds
- Recommended protocols (use skill defaults)
- Optional protocols (use skill defaults)

**Good for:** Lean projects, teams customizing only load-bearing conventions while using skill defaults for UX.

---

## Recommended (Default)

**Intent:** Install the sensible baseline — everything required plus quality-of-UX conventions used across most StackShift projects.

**Materialized:**
- Required + recommended protocols → `.stackshift/protocol/`
- Project protocol registry → `.stackshift/protocol/_registry.json` (empty)
- Protocol template → `.stackshift/protocol/_template/`
- References directory → `.stackshift/references/` (empty)

**Not materialized:**
- Seeds
- Optional protocols (use skill defaults)

**Good for:** New projects, most teams, the "just get started" path.

---

## All

**Intent:** Install every protocol the skill ships with, including optional systems that bring their own architecture and dependencies.

**Materialized:**
- All protocols (required + recommended + optional) → `.stackshift/protocol/`
- Project protocol registry → `.stackshift/protocol/_registry.json` (empty)
- Protocol template → `.stackshift/protocol/_template/`
- References directory → `.stackshift/references/` (empty)

**Not materialized:**
- Seeds

**Warning:** Optional protocols may require dependencies not yet installed (shadcn, react-hook-form, context providers, etc.). Installing protocols to `.stackshift/protocol/` does not install runtime dependencies — install those separately. See each optional protocol's documentation.

**Good for:** Teams auditing what StackShift offers, internal documentation projects, reference setups.

---

## Interactive

**Intent:** Exact control over which protocols land in `.stackshift/protocol/`. Useful for brownfield adoption or selective optional system adoption.

**Result:**
- Multi-select prompt for protocols renders as `[tier] title — summary`
- Required items pre-checked with warning if unchecked (allowed but not recommended)
- Recommended items pre-checked
- Optional items unchecked
- Only checked items copied

**Always materialized:**
- Selected protocols → `.stackshift/protocol/`
- Project protocol registry → `.stackshift/protocol/_registry.json` (empty)
- Protocol template → `.stackshift/protocol/_template/`
- References directory → `.stackshift/references/` (empty)

**Never materialized:**
- Seeds

**Good for:** Brownfield adoption, teams with strong existing conventions, selective optional system adoption.

---

## Protocol Discovery After Bootstrap

When the workflow needs a protocol, discovery happens via **merged registries**:

1. **Read project registry:** `.stackshift/protocol/_registry.json` (if exists)
2. **Read skill registry:** `protocols/_registry.json`
3. **Merge:** Project protocols take precedence over skill protocols with same ID
4. **Load on-demand:** When protocol needed, load from:
   - `.stackshift/protocol/<id>.md` or `.stackshift/protocol/<id>/` (project)
   - `protocols/<id>.md` or `protocols/<id>/` (skill fallback)

**Key behaviors:**
- Mode `none` still gets working defaults (from skill protocols)
- Editing a protocol in `.stackshift/protocol/` immediately overrides skill default
- Deleting a protocol from `.stackshift/protocol/` falls back to skill default
- **Adding custom protocols to `.stackshift/protocol/_registry.json` makes them discoverable**

---

## Seeds (Not Materialized)

Seeds follow standard strategies and load from skill when seeding is needed.

---

## No Re-Bootstrap Needed

**Before (old architecture):** Adding new protocols required re-bootstrapping to materialize them.

**Now (registry-based):** Custom protocols via registry:
- Add protocol file to `.stackshift/protocol/`
- Register in `.stackshift/protocol/_registry.json`
- Protocol discovered on next workflow invocation
- No re-bootstrap cycle needed

Project infrastructure files (`_registry.json`, `_template/`, `references/`) persist across skill updates and enable continuous protocol development.
