---
name: stackshift-protocols-recommended
description: Required and recommended conventions for StackShift schema development
tags: [stackshift, protocols]
recommended: true
type: protocols-bundle
tier: recommended
requires: stackshift-core
---

# StackShift Protocols — Recommended

Requires `stackshift-core` to be installed alongside this skill.
Protocol files live in `stackshift-core/protocols/`. Load on demand — never all at once.

| Protocol | File in core | Load when |
|---|---|---|
| Factory Function Pattern | `protocols/factory-function-pattern.md` | Creating any new field (Step 1) |
| Sub-Field Visibility | `protocols/sub-field-visibility.md` | Hiding a sub-field within an object (Step 1) |
| Variant Router | `protocols/variant-router.md` | Building `index.tsx` (Step 4) |
| One-Time Custom Schema Setup | `protocols/one-time-custom-schema-setup.md` | First section in a new project (Step 2) |
| Field Reuse First | `protocols/field-reuse-first.md` | Before creating any new field (Step 1) |
| Hide If Variant | `protocols/hide-if-variant.md` | Adding a new variant (Step 1) |
| Preview Conventions | `protocols/preview-conventions.md` | Any array of objects or object field (Step 1) |
| Array Layout | `protocols/array-layout.md` | Any array field (Step 1) |
| Section Directory Layout | `protocols/section-directory-layout.md` | After finalizing section schema (Step 2) |
| Accessibility | `protocols/accessibility.md` | Activates WCAG 2.1 AA enforcement in UI Forge (Step 4) |
