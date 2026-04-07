---
name: stackshift-protocols-required
description: Required conventions for StackShift schema development — violations cause build errors, runtime errors, or schema load failures
tags: [stackshift, protocols]
recommended: true
type: protocols-bundle
tier: required
requires: stackshift-core
---

# StackShift Protocols — Required

Requires `stackshift-core` to be installed alongside this skill.
Protocol files live in `stackshift-core/protocols/`. Load on demand — never all at once.

| Protocol | File in core | Load when |
|---|---|---|
| Factory Function Pattern | `protocols/factory-function-pattern.md` | Creating any new field (Step 1) |
| Sub-Field Visibility | `protocols/sub-field-visibility.md` | Hiding a sub-field within an object (Step 1) |
| Variant Router | `protocols/variant-router.md` | Building `index.tsx` (Step 4) |
| One-Time Custom Schema Setup | `protocols/one-time-custom-schema-setup.md` | First section in a new project (Step 2) |
