# Protocol — Modal & Sheet

**Tier:** Optional
**Adds to workflow:** Step 2 (schema), Step 4 (variant), Step 5 (GROQ/types)
**Dependencies:** `@stackshift-ui/sheet`, `@stackshift-ui/dialog`, `ModalContext`

Standalone modal documents that editors create in Sanity Studio and link to from any button or link field via `conditionalLink`. When a link carries `linkType: "linkModal"`, the GROQ query resolves a `modalRef`; `ModalContext.openModalByRef()` intercepts the click and opens a Sheet or Dialog overlay instead of navigating.

```
Studio → Modal doc → conditionalLink(linkModal)
→ GROQ resolves modalRef → ModalContext.openModalByRef()
→ @stackshift-ui/sheet or @stackshift-ui/dialog variant
```

---

**Two modes — determine which applies before loading any sub-doc:**

**IF this is first-time setup** (verify: `context/ModalContext.tsx` does not exist, no `modal` Sanity document schema exists):
1. `setup.md` — all infrastructure; run once, never revisit

**IF adding a new modal variant** (system is already set up):
1. `variant-template.md` — structural shell for the variant file
2. `integration-with-workflow.md` — Step 4 sub-step overrides and UI Forge delegation
3. `checklist.md` Section B — per-variant done-when list
