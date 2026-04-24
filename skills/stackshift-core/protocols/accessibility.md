# Protocol — Accessibility (`SIGNAL_A11Y`)

**Tier:** recommended
**Applies to:** Step 4 (Component Variant)

When this protocol is installed, bootstrap writes `a11yRequired: true` to `.stackshift/installed.json`. UI Forge detects this marker in paired mode and automatically composes `SIGNAL_A11Y` into every variant generation — no per-invocation flag needed.

**StackShift owns activation. UI Forge owns enforcement.**

UI Forge's `SIGNAL_A11Y` addendum covers:
- Semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<section>`, etc.)
- Accessible names on all interactive elements (`aria-label`, `aria-labelledby`)
- Focus visibility on all keyboard-reachable controls
- Reduced-motion handling (`prefers-reduced-motion` media query)
- WCAG 2.1 AA conformance as the minimum bar

---

## Step 4 integration

When the accessibility protocol is active, the FORGE NOTES header in the generated variant file will include an `A11Y` sub-block describing which rules were applied. If that sub-block is absent after generation, halt Step 4 — the generation context did not pick up the protocol correctly.

**Postcondition (when this protocol is active):**
- [ ] `// FORGE NOTES` header contains an `A11Y` sub-block

---

## Activation

Selected during bootstrap (recommended — pre-checked in interactive mode). Bootstrap automatically writes the `a11yRequired` marker when this protocol is included in the materialized set.

To verify activation, check `.stackshift/installed.json` for `"a11yRequired": true`.

To add after initial bootstrap: set `"a11yRequired": true` in `.stackshift/installed.json` manually. UI Forge picks it up on the next Step 4 invocation.
