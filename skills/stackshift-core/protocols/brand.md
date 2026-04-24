# Protocol — Brand (`SIGNAL_BRAND`)

**Tier:** optional
**Applies to:** Step 4 (Component Variant)

When this protocol is installed, bootstrap registers `designStandards.brand` in `design/design-arch.json` pointing to `./design/standards/brand.md` and creates a starter file at that path. UI Forge's role classifier detects this registration and composes `SIGNAL_BRAND` into variant generation — applying voice, palette, typography, and imagery rules from the brand document.

**StackShift owns registration. UI Forge owns enforcement.**

---

## Brand document location

```
design/
└── standards/
    └── brand.md          ← your project brand document
```

Bootstrap creates this file with a starter template if it does not already exist. If the file already exists, bootstrap never overwrites it — the file is yours to maintain and version alongside your codebase.

---

## Brand document shape

UI Forge's brand pipeline reads the document as unstructured context. At minimum, cover these sections:

| Section | Description |
|---------|-------------|
| Voice and tone | Writing register, formality level, sentence structure guidelines |
| Color palette | Named color roles (primary, secondary, neutral, accent) with usage rules |
| Typography | Heading levels → font / weight / size mapping; body text defaults |
| Imagery | Photography style, illustration tone, icon set restrictions |

You may add additional sections. The key constraint is that the file exists at the registered path.

---

## Step 4 integration

When the brand protocol is active, the FORGE NOTES header in the generated variant file will include a `BRAND` sub-block describing which brand rules were applied. If that sub-block is absent after generation, check that `design/design-arch.json` contains `designStandards.brand` pointing to an existing file.

---

## Activation

Selected during bootstrap (optional — unchecked by default in interactive mode). Because this protocol introduces a new project file (`design/standards/brand.md`) and a `designStandards` registration, only install it when the project has brand guidelines to enforce.

To add after initial bootstrap:
1. Create `design/standards/brand.md` with your brand document content.
2. Add `"brand": "./design/standards/brand.md"` to the `designStandards` object in `design/design-arch.json`.
