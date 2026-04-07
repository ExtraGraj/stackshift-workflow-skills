# Reference — GROQ Fragment Constants

All projections live in `pages/api/query.ts`. The top of that file defines reusable string constants. **Interpolate these** — do not rewrite known shapes inline.

---

## Defined constants

```typescript
const conditionalLinkFields = `
  label,
  linkTarget,
  "type": linkType,
  "internalLink": linkInternal->slug.current,
  "externalLink": linkExternal
`;

const mainImageFields = `
  "image": mainImage.image.asset->url,
  "alt": mainImage.alt
`;

const logoImageField = `
  "image": *[_type == "sanity.imageAsset" && _id == ^.image.asset._ref][0].url
`;

const socialMediaIconFields = `
  ...,
  "image": *[_type == "sanity.imageAsset" && _id == ^.image.asset._ref][0].url
`;
```

---

## Interpolated in the `variants` query

```typescript
const variants = `
  variants {
    ...,

    primaryButton != null => { primaryButton { ${conditionalLinkFields} } },

    secondaryButton != null => { secondaryButton { ${conditionalLinkFields} } },

    mainImage != null => { "mainImage": { ${mainImageFields} } },

    logo != null => {
      logo { alt, ${logoImageField}, linkTarget, ${conditionalLinkFields} }
    },

    images != null => {
      images[] { ${logoImageField}, "alt": alt }
    },

    socialLinks[] {
      ...,
      socialMediaIcon { ${socialMediaIconFields} }
    },

    blogPosts != null => {
      "posts": blogPosts[]-> {
        ...,
        "link": slug.current,
        authors[]-> {
          ...,
          "link": slug.current,
          "profileImage": *[_type == "sanity.imageAsset" && _id == ^.image.asset._ref][0].url
        },
        "mainImage": *[_type == "sanity.imageAsset" && _id == ^.mainImage.asset._ref][0].url,
        categories[]->
      }
    },

    form != null => {
      form {
        ...,
        fields[] {
          ...,
          isGroup == true => { fields[] { ... } },
          labelLink
        },
        thankYouPage { ..., ${conditionalLinkFields} }
      }
    },
  }
`;
```

---

## Composite patterns

**Array of objects containing a `mainImage`:**
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

**Rename output keys:**
```typescript
askedQuestions != null => { "faqs": askedQuestions[] { ... } },
statItems != null => { "stats": statItems[] { ... } },
```

Only rename when the component expects a different key. Don't rename arbitrarily.
