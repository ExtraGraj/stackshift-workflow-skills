# Bootstrap — Install Modes

Authoritative definitions of the five install modes offered during bootstrap. Each mode determines which protocols are materialized and whether project infrastructure is created.

---

## None

**Intent:** Evaluate the skill without committing to conventions yet, or use skill defaults exclusively.

**Availability:** AI-agent bootstrap prompt only. Not available via the CLI (`npx @extragraj/stackshift-skills init`). The CLI always writes a bootstrap marker with a selected tier.

**Materialized:**
- Nothing copied to `.stackshift/protocols/`
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
- Required protocols → `.stackshift/protocols/`
- Project protocol registry → `.stackshift/protocols/_registry.json` (empty)
- Protocol template → `.stackshift/protocols/_template/`
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
- Required + recommended protocols → `.stackshift/protocols/`
- Project protocol registry → `.stackshift/protocols/_registry.json` (empty)
- Protocol template → `.stackshift/protocols/_template/`
- References directory → `.stackshift/references/` (empty)

**Not materialized:**
- Seeds
- Optional protocols (use skill defaults)

**Good for:** New projects, most teams, the "just get started" path.

---

## All

**Intent:** Install every protocol the skill ships with, including optional systems that bring their own architecture and dependencies.

**Materialized:**
- All protocols (required + recommended + optional) → `.stackshift/protocols/`
- Project protocol registry → `.stackshift/protocols/_registry.json` (empty)
- Protocol template → `.stackshift/protocols/_template/`
- References directory → `.stackshift/references/` (empty)

**Not materialized:**
- Seeds

**Warning:** Optional protocols may require dependencies not yet installed (shadcn, react-hook-form, context providers, etc.). Installing protocols to `.stackshift/protocols/` does not install runtime dependencies — install those separately. See each optional protocol's documentation.

**Good for:** Teams auditing what StackShift offers, internal documentation projects, reference setups.

---

## Interactive

**Intent:** Exact control over which protocols land in `.stackshift/protocols/`. Useful for brownfield adoption or selective optional system adoption.

**Result:**
- Multi-select prompt for protocols renders as `[tier] title — summary`
- Required items pre-checked with warning if unchecked (allowed but not recommended)
- Recommended items pre-checked
- Optional items unchecked
- Only checked items copied

**Always materialized:**
- Selected protocols → `.stackshift/protocols/`
- Project protocol registry → `.stackshift/protocols/_registry.json` (empty)
- Protocol template → `.stackshift/protocols/_template/`
- References directory → `.stackshift/references/` (empty)

**Never materialized:**
- Seeds

**Good for:** Brownfield adoption, teams with strong existing conventions, selective optional system adoption.

---

## Protocol Discovery After Bootstrap

**Enforcement** (which protocols are loaded at each workflow step) reads from `.stackshift/installed.json` → `protocols` array. Bootstrap writes this array from the resolved selection above. Each workflow step checks only protocols whose `id` is present in that array. If the file is missing or the array is absent, enforcement is a no-op and the workflow continues.

**File lookup** (where to find a protocol file once it is selected for loading):
1. `.stackshift/protocols/<id>.md` or `.stackshift/protocols/<id>/` — project copy (created by bootstrap, customizable by the team)
2. `protocols/<id>.md` or `protocols/<id>/` in the skill folder — read-only fallback

Project copies always take precedence. Custom protocols registered in `.stackshift/protocols/_registry.json` are discoverable via the same lookup.

**Key behaviors:**
- Mode `none` installs no protocols and writes an empty `protocols` array — enforcement is a no-op; skill defaults load at file-lookup time
- Editing a protocol in `.stackshift/protocols/` immediately overrides the skill default
- Deleting a protocol from `.stackshift/protocols/` falls back to the skill default
- **Adding custom protocols to `.stackshift/protocols/_registry.json` makes them discoverable at file-lookup time**

---

## Seeds (Not Materialized)

Seeds follow standard strategies and load from skill when seeding is needed.

---

## No Re-Bootstrap Needed

**Before (old architecture):** Adding new protocols required re-bootstrapping to materialize them.

**Now (registry-based):** Custom protocols via registry:
- Add protocol file to `.stackshift/protocols/`
- Register in `.stackshift/protocols/_registry.json`
- Protocol discovered on next workflow invocation
- No re-bootstrap cycle needed

Project infrastructure files (`_registry.json`, `_template/`, `references/`) persist across skill updates and enable continuous protocol development.
