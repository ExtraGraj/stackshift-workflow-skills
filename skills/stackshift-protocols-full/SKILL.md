---
name: stackshift-protocols-full
description: All StackShift protocols — required, recommended, and optional
tags: [stackshift, protocols]
recommended: false
type: protocols-bundle
tier: optional
requires: stackshift-core
---

# StackShift Protocols — Full

Requires `stackshift-core` to be installed alongside this skill.
Protocol files live in `stackshift-core/protocols/`. Load on demand — never all at once.

| Protocol | Tier | File in core | Load when |
|---|---|---|---|
| Factory Function Pattern | required | `protocols/factory-function-pattern.md` | Creating any new field (Step 1) |
| Sub-Field Visibility | required | `protocols/sub-field-visibility.md` | Hiding a sub-field within an object (Step 1) |
| Variant Router | required | `protocols/variant-router.md` | Building `index.tsx` (Step 4) |
| One-Time Custom Schema Setup | required | `protocols/one-time-custom-schema-setup.md` | First section in a new project (Step 2) |
| Field Reuse First | recommended | `protocols/field-reuse-first.md` | Before creating any new field (Step 1) |
| Hide If Variant | recommended | `protocols/hide-if-variant.md` | Adding a new variant (Step 1) |
| Preview Conventions | recommended | `protocols/preview-conventions.md` | Any array of objects or object field (Step 1) |
| Array Layout | recommended | `protocols/array-layout.md` | Any array field (Step 1) |
| Section Directory Layout | recommended | `protocols/section-directory-layout.md` | After finalizing section schema (Step 2) |
| Accessibility | recommended | `protocols/accessibility.md` | Activates WCAG 2.1 AA enforcement in UI Forge (Step 4) |
| Brand | optional | `protocols/brand.md` | Registers a project brand document for UI Forge's brand signal (Step 4) |
