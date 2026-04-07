# Step 5 — GROQ Query

> Load `references/groq-fragments.md` for the full list of reusable fragment constants.

All projections live in `pages/api/query.ts` inside the `variants` template literal. **Never write inline GROQ outside this file.**

---

## Decision table — does this field need a projection?

| Field type | Projection needed? | Why |
|---|---|---|
| `string`, `text`, `boolean`, `number`, `date` | ❌ No | `...` spread captures them |
| `mainImage` object | ✅ Yes | Asset dereferencing |
| `conditionalLink` | ✅ Yes | Dereference + rename |
| Array of objects | ✅ Yes | Each item needs `_key` + sub-fields |
| `reference` field | ✅ Yes | Needs `->` dereference |
| Raw `image` | ✅ Yes | Needs `asset->url` |

**Golden rule:** Scalar fields are captured by `...`. Do not write projections for them.

---

## Null-check pattern (always use)

```groq
variants {
  ...,
  myObjectField != null => {
    myObjectField { fieldA, fieldB }
  },
  myArray != null => {
    myArray[] { _key, title, plainText }
  },
}
```

---

## Reuse fragment constants — never rewrite known shapes

The top of `pages/api/query.ts` defines constants like `conditionalLinkFields`, `mainImageFields`, `logoImageField`, `socialMediaIconFields`. **Interpolate them**, do not rewrite inline.

```typescript
primaryButton != null => { primaryButton { ${conditionalLinkFields} } },
mainImage != null => { "mainImage": { ${mainImageFields} } },
```

**Array of objects containing `mainImage`:**
```typescript
myItems != null => {
  myItems[] { ..., "mainImage": { ${mainImageFields} } }
},
```

**Array of objects containing a `conditionalLink`:**
```typescript
myItems != null => {
  myItems[] {
    ...,
    link != null => { link { ${conditionalLinkFields} } }
  }
},
```

See `references/groq-fragments.md` for the full catalog.

---

## Renaming output keys

Only rename when there's a clear reason the component expects a different key:

```groq
askedQuestions != null => { "faqs": askedQuestions[] { ... } },
statItems != null => { "stats": statItems[] { ... } },
```

Don't rename arbitrarily.

---

## Done when

- [ ] Only non-scalar fields have explicit projections
- [ ] Scalars left to the `...` spread
- [ ] All projections use the null-check pattern
- [ ] Reusable fragment constants interpolated — no inline rewrites of known shapes
- [ ] Renamed keys match what the component expects

→ Proceed to `workflow/checklist.md` for the final quality gate.
