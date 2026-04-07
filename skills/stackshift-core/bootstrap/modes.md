# Bootstrap — Install Modes

Authoritative definitions of the five install modes offered during bootstrap. Each mode maps to a tier-based filter over `protocols/_registry.json` and `seeds/_registry.json`.

---

## None

**Intent:** You want a clean slate. You will write your own protocols and seeds, or you want to evaluate the skill without committing to any conventions yet.

**Result:**
- No files copied to `/docs/protocol/` or `/docs/seed/`.
- `.stackshift/installed.json` records `mode: "none"` with empty selection arrays.
- Workflow still functions — the skill falls back to the bundled protocols and seeds in the skill folder at lookup time.

**Good for:** Experimental projects, pilots, teams that already have their own conventions documented elsewhere.

---

## Required

**Intent:** You want only the protocols the workflow strictly depends on — the ones whose violation causes build errors, runtime errors, or schema load failures. Everything else stays in the skill as a fallback.

**Result:**
- Every protocol where `tier === "required"` is copied.
- Every seed where `tier === "required"` is copied (currently none).
- Recommended and optional items are skipped.

**Good for:** Lean projects, teams that want to customize only the load-bearing conventions and leave UX defaults to the skill.

---

## Recommended (default)

**Intent:** You want the sensible baseline — everything required, plus the quality-of-UX conventions we've found useful across most StackShift projects — without the heavyweight optional systems.

**Result:**
- Every protocol where `tier === "required"` OR `tier === "recommended"` is copied.
- Same for seeds.
- Optional items are skipped.

**Good for:** New projects, most teams, the "just get me going" path.

---

## All

**Intent:** You want every protocol and seed the skill ships with, including optional systems that bring their own architecture and dependencies. Useful for auditing the full catalog.

**Result:**
- Every item in both registries is copied, regardless of tier.
- `.stackshift/installed.json` records `mode: "all"`.

**Warning:** Optional protocols may require dependencies you have not installed yet (shadcn, react-hook-form, context providers, etc.). Installing them into `/docs/` does not install the runtime dependencies — you must do that separately. See each optional protocol's README.

**Good for:** Teams auditing what StackShift offers, internal documentation projects, reference setups.

---

## Interactive

**Intent:** You want exact control over which items land in `/docs/`. Useful when adopting the skill into an existing codebase that already has some conventions documented, or when picking specific optional systems.

**Result:**
- A single multi-select prompt for protocols. Each item renders as `[tier] title — summary`.
- A single multi-select prompt for seeds.
- Required items are **pre-checked**; unchecking a required item produces a warning (but is allowed).
- Recommended items are pre-checked.
- Optional items are unchecked.
- Only the checked items are copied.

**Good for:** Brownfield adoption, teams with strong existing opinions, selective adoption of optional systems.

---

## Switching modes later

`.stackshift/installed.json` tracks the current mode. To change it:

1. Ask the AI: "re-bootstrap StackShift skill with mode: <n>".
2. The skill diffs the current installation against the new selection.
3. Missing files get copied. Existing files are NEVER overwritten — the skill asks per file.
4. The marker is updated to the new mode.

Mode changes only add files — they never remove. To remove a protocol from `/docs/`, delete it manually; the skill will fall back to its bundled copy at lookup time.

---

## What happens at lookup time

When the workflow needs a protocol or seed, it looks in this order:

1. `/docs/protocol/<id>.md` or `/docs/protocol/<id>/` in the project
2. `protocols/<id>.md` or `protocols/<id>/` in the skill folder

**Project docs always win.** This means:
- Mode `none` still gets working defaults (from the skill folder).
- Editing a copied file in `/docs/` immediately overrides the skill's default for that project.
- Deleting a copied file falls back to the skill default — no re-bootstrap needed.
