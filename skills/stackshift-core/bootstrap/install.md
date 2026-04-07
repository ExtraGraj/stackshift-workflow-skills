# Bootstrap — First-Run Install Flow

> **Who reads this:** the AI, on first invocation of the StackShift skill in a new project.
> **Trigger:** `.stackshift/installed.json` does not exist in the project root.

The goal of bootstrap is to materialize the selected protocol and seed reference docs into the project's `/docs/` folder so the team can customize them, then drop a marker file recording what was installed.

---

## Step 1 — Detect install state

Check for `.stackshift/installed.json` in the project root.

- **Exists** → skill is already bootstrapped. Skip the rest of this file and return to the workflow.
- **Does not exist** → continue.

---

## Step 2 — Read the registries

Load the two manifests from the skill folder:

- `protocols/_registry.json`
- `seeds/_registry.json`

Each entry carries a `tier` (`required` / `recommended` / `optional`), a `title`, a `summary`, and either a `file` (single markdown) or a `dir` (directory to copy recursively).

**Do not load the actual protocol/seed content yet.** The registries are intentionally small so this step stays cheap.

---

## Step 3 — Prompt the user for install mode

Present the five modes using the `ask_user_input_v0` tool if available, otherwise in plain conversation. See `bootstrap/modes.md` for the authoritative definitions.

> **Quick-reference summary to show the user:**
>
> | Mode | What it does |
> |---|---|
> | **None** | Install nothing. `/docs/` stays empty. Skill falls back to bundled defaults at lookup time. |
> | **Required** | Install only protocols with `tier: required`. Minimal customizable surface. |
> | **Recommended** *(default)* | Install all `tier: required` + `tier: recommended`. The sensible baseline. |
> | **All** | Install everything in both registries, including `tier: optional`. |
> | **Interactive** | Checkbox list — required items pre-checked, recommended items pre-checked, optional items unchecked. |

Default recommendation: **Recommended**.

---

## Step 4 — Resolve the selection

Based on the chosen mode, build two lists — `selectedProtocols` and `selectedSeeds`:

| Mode | Protocols selected | Seeds selected |
|---|---|---|
| None | `[]` | `[]` |
| Required | `tier === "required"` | `tier === "required"` |
| Recommended | `tier === "required" OR tier === "recommended"` | `tier === "required" OR tier === "recommended"` |
| All | every entry | every entry |
| Interactive | user's checked items from two multi-select prompts | same |

For **Interactive**, show one prompt per registry. Each item renders as `[tier] title — summary`. Required items are pre-checked AND the user is warned (but not blocked) if they uncheck one: "This is a required protocol — unchecking means the workflow will fall back to the skill-bundled copy instead of a project copy you can customize. Continue?".

---

## Step 5 — Materialize the selected files

For each selected protocol:

```
if entry.file is set:
  source:      <skill>/protocols/<entry.file>
  destination: <project>/docs/protocol/<entry.file>
  action:      copy as single file

if entry.dir is set:
  source:      <skill>/protocols/<entry.dir>/
  destination: <project>/docs/protocol/<entry.dir>/
  action:      copy directory recursively
```

Seeds use the same pattern but under `<project>/docs/seed/`.

Create the destination directories if they do not exist:

```
/docs/
├── protocol/
└── seed/
```

**Copy verbatim.** Do not rewrite, summarize, or reformat. The project copies are meant to be customized by the team — preserving the original as the starting point is important.

**Conflict rule:** If a destination already exists (file or directory), do NOT overwrite silently. Ask per-entry: *skip*, *overwrite*, or *write alongside as `<n>.new.md` / `<dir>.new/`*.

---

## Step 6 — Write the install marker

Create `<project>/.stackshift/installed.json`:

```json
{
  "skillVersion": "<read from skill.version>",
  "installedAt": "<ISO timestamp>",
  "mode": "recommended",
  "protocols": [
    { "id": "factory-function-pattern", "tier": "required", "file": "factory-function-pattern.md" },
    { "id": "sub-field-visibility", "tier": "required", "file": "sub-field-visibility.md" },
    { "id": "field-reuse-first", "tier": "recommended", "file": "field-reuse-first.md" }
  ],
  "seeds": []
}
```

This file is the source of truth for what has been installed. Future invocations read it to:

- Skip bootstrap entirely (it exists → we're done).
- Detect registry additions that could be offered to the user with a non-blocking "new protocols available" notice.
- Support a future `re-bootstrap` command.

---

## Step 7 — Report and return

Print a summary:

```
Bootstrapped StackShift skill (mode: recommended)
  /docs/protocol/  ← 9 items (4 required, 5 recommended)
  /docs/seed/      ← 0 items
  .stackshift/installed.json written

Edit files under /docs/protocol/ and /docs/seed/ freely. Your edits
take precedence over the skill's defaults at lookup time.
```

Return to the workflow step the user originally invoked. Do not treat bootstrap as the answer to their actual request.

---

## Idempotency and re-runs

- Running bootstrap when `.stackshift/installed.json` exists is a no-op unless the user explicitly asks to re-bootstrap.
- On explicit re-bootstrap, read the existing marker, offer to install **only new items** added to the registries since the last install, and never silently overwrite customized files.
- Changing install mode is a valid re-bootstrap reason. The skill diffs current → new selection and asks per-item for additions; it never removes installed files.
