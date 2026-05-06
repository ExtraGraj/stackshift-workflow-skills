import { writeFileSync, renameSync } from 'fs';
import fsExtra from 'fs-extra';
const { copySync, ensureDirSync, readJsonSync, writeJsonSync, pathExistsSync, readFileSync, removeSync } = fsExtra;
import { join, resolve, basename } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import type { InstallChoices, ProtocolTier, Platform } from './prompts.js';
import type { ProtocolEntry, SkillEntry } from './registry.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const skillsDir = resolve(__dirname, '../../skills');
const protocolsDir = resolve(__dirname, '../../skills/stackshift-core/protocols');
const skillVersionPath = resolve(__dirname, '../../skill.version');

const LOCK_FILE = 'skills-lock.json';

/**
 * Project and global skill root dirs for each supported platform.
 * - project: relative dir under cwd (without trailing /skills)
 * - global: relative dir under homedir (without trailing /skills)
 */
const PLATFORM_PROJECT_DIR: Record<Platform, string> = {
  claude: '.claude',
  agents: '.agents',
  copilot: '.github',
  gemini: '.agents',
  cursor: '.cursor',
};

const PLATFORM_GLOBAL_DIR: Record<Platform, string> = {
  claude: '.claude',
  agents: '.agents',
  copilot: '.copilot',
  gemini: join('.gemini', 'antigravity'),
  cursor: '.cursor',
};

/**
 * Atomic JSON write: write to a `.tmp` file, then rename.
 * Prevents lock-file corruption if the process is killed mid-write.
 */
function writeJsonAtomic(filePath: string, data: unknown): void {
  const tmpPath = `${filePath}.tmp`;
  writeJsonSync(tmpPath, data, { spaces: 2 });
  renameSync(tmpPath, filePath);
}

interface LockEntry {
  name: string;
  installedAt: string;
  scope: 'project' | 'global';
}

interface LockFile {
  skills: LockEntry[];
}

function resolveTargetDir(scope: 'project' | 'global', platform: Platform): string {
  const baseDir = scope === 'global'
    ? PLATFORM_GLOBAL_DIR[platform]
    : PLATFORM_PROJECT_DIR[platform];
  if (scope === 'global') return join(homedir(), baseDir, 'skills');
  return join(process.cwd(), baseDir, 'skills');
}

function resolveLockPath(scope: 'project' | 'global', platform: Platform): string {
  const baseDir = scope === 'global'
    ? PLATFORM_GLOBAL_DIR[platform]
    : PLATFORM_PROJECT_DIR[platform];
  if (scope === 'global') return join(homedir(), baseDir, LOCK_FILE);
  return join(process.cwd(), baseDir, LOCK_FILE);
}

/**
 * Update skills-lock.json (source of truth for installed skills).
 *
 * INTENTIONAL: Filters out previous entry with same name to prevent duplicates.
 * For protocol bundles, this means only one tier can be active at a time.
 */
function appendLock(lockPath: string, entry: LockEntry): void {
  let lock: LockFile = { skills: [] };
  if (pathExistsSync(lockPath)) {
    lock = readJsonSync(lockPath) as LockFile;
  }
  lock.skills = lock.skills.filter((s) => s.name !== entry.name);
  lock.skills.push(entry);
  writeJsonAtomic(lockPath, lock);
}

function copySkillFolder(folderPath: string, targetDir: string): void {
  const folderName = basename(folderPath);
  const dest = join(targetDir, folderName);
  copySync(folderPath, dest, { overwrite: true });
}

function buildCustomProtocolSkill(
  additionalIds: string[],
  allProtocols: ProtocolEntry[],
  targetDir: string,
): void {
  const selected = allProtocols.filter(
    (p) => p.tier === 'required' || additionalIds.includes(p.id),
  );

  const tierLabel =
    additionalIds.length === 0 ? 'required' : `required + ${additionalIds.join(', ')}`;

  const rows = selected
    .map((p) => {
      const pathValue = p.file ? `protocols/${p.file}` : `protocols/${p.dir}`;
      return `| ${p.title} | \`${pathValue}\` | — |`;
    })
    .join('\n');

  const skillContent = matter.stringify(
    `# StackShift Protocols — Custom (${tierLabel})\n\n` +
    `Requires \`stackshift-core\` to be installed alongside this skill.\n` +
    `Protocol files live in \`stackshift-core/protocols/\`. Load on demand.\n\n` +
    `| Protocol | File in core | Load when |\n|---|---|---|\n${rows}\n`,
    {
      name: 'stackshift-protocols-custom',
      description: `Custom protocol selection: ${tierLabel}`,
      tags: ['stackshift', 'protocols'],
      recommended: false,
      type: 'protocols-bundle',
      tier: 'required',
      requires: 'stackshift-core',
    },
  );

  const dest = join(targetDir, 'stackshift-protocols-custom');
  ensureDirSync(dest);
  writeFileSync(join(dest, 'SKILL.md'), skillContent, 'utf8');
}

function resolveProtocolSkillName(tier: Exclude<ProtocolTier, 'custom'>): string {
  const map: Record<string, string> = {
    required: 'stackshift-protocols-required',
    recommended: 'stackshift-protocols-recommended',
    full: 'stackshift-protocols-full',
  };
  return map[tier];
}

/**
 * Detect all platforms where StackShift is currently installed.
 * Deduplicates on the resolved path so gemini/agents (same project dir) count once.
 */
function getInstalledPlatforms(scope: 'project' | 'global'): Platform[] {
  const platforms: Platform[] = [];
  const seenDirs = new Set<string>();
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];

  for (const platform of allPlatforms) {
    const targetDir = resolveTargetDir(scope, platform);
    if (seenDirs.has(targetDir)) continue;
    const coreDir = join(targetDir, 'stackshift-core');
    if (pathExistsSync(coreDir)) {
      platforms.push(platform);
      seenDirs.add(targetDir);
    }
  }

  return platforms;
}

/**
 * Remove old protocol bundle folders when installing a new tier.
 * Only one protocol tier can be active at a time.
 */
function cleanupOldProtocolBundles(targetDir: string, newBundleName: string): string[] {
  const removed: string[] = [];
  const bundleNames = [
    'stackshift-protocols-required',
    'stackshift-protocols-recommended',
    'stackshift-protocols-full',
    'stackshift-protocols-custom',
  ];

  for (const oldBundle of bundleNames) {
    if (oldBundle !== newBundleName) {
      const oldPath = join(targetDir, oldBundle);
      if (pathExistsSync(oldPath)) {
        try {
          removeSync(oldPath);
          removed.push(oldBundle);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`Warning: Could not remove ${oldBundle}: ${message}`);
        }
      }
    }
  }

  return removed;
}

/**
 * Remove old protocol bundles from lock file.
 */
function cleanupLockFile(lockPath: string, newBundleName: string): void {
  if (!pathExistsSync(lockPath)) return;
  try {
    const lock = readJsonSync(lockPath) as LockFile;
    lock.skills = lock.skills.filter(
      (s) => !s.name.startsWith('stackshift-protocols-') || s.name === newBundleName,
    );
    writeJsonAtomic(lockPath, lock);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not clean lock file ${lockPath}: ${message}`);
  }
}

/**
 * Write .stackshift/installed.json marker for AI agent bootstrap.
 *
 * bootstrapDone = true  → CLI ran --bootstrap materialization; do NOT set bootstrapRequired.
 * bootstrapDone = false → Fresh install or re-install; set bootstrapRequired: true only when
 *                         this is a new project (marker didn't exist) or it still has the flag.
 */
function writeStackshiftMarker(
  choices: InstallChoices,
  allProtocols: ProtocolEntry[],
  bootstrapDone: boolean,
): void {
  if (choices.scope !== 'project') return;

  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');

  const markerExisted = pathExistsSync(markerPath);
  let existing: Record<string, unknown> = {};
  if (markerExisted) {
    try {
      existing = readJsonSync(markerPath) as Record<string, unknown>;
    } catch { /* overwrite on parse failure */ }
  }

  let skillVersion = '0.1.0';
  try {
    skillVersion = readFileSync(skillVersionPath, 'utf8').trim();
  } catch { /* use default */ }

  const tierTiersMap: Record<ProtocolTier, Array<'required' | 'recommended' | 'optional'>> = {
    required: ['required'],
    recommended: ['required', 'recommended'],
    full: ['required', 'recommended', 'optional'],
    custom: ['required'],
  };

  let protocols = allProtocols.filter((p) => tierTiersMap[choices.protocolTier].includes(p.tier));
  if (choices.protocolTier === 'custom') {
    const extras = allProtocols.filter((p) => choices.customProtocols.includes(p.id));
    protocols = [...protocols, ...extras];
  }

  const modeMap: Record<ProtocolTier, string> = {
    required: 'required',
    recommended: 'recommended',
    full: 'all',
    custom: 'interactive',
  };

  ensureDirSync(join(process.cwd(), '.stackshift'));

  // Strip fields that need controlled re-emission
  const {
    seed: _prevSeed,
    bootstrapRequired: _prevBootstrapRequired,
    ...restExisting
  } = existing as Record<string, unknown> & { seed?: string; bootstrapRequired?: boolean };

  const mode = choices.keepProtocol && existing.mode
    ? String(existing.mode)
    : modeMap[choices.protocolTier];

  const protocolList = choices.keepProtocol && existing.protocols
    ? existing.protocols as Array<{ id: string; tier: string; file?: string; dir?: string }>
    : protocols.map(({ id, tier, file, dir }) => {
        const entry: { id: string; tier: string; file?: string; dir?: string } = { id, tier };
        if (file) entry.file = file;
        if (dir) entry.dir = dir;
        return entry;
      });

  // Set bootstrapRequired: true only for fresh installs or when it was already set (agent hasn't run yet)
  const needsBootstrapRequired = !bootstrapDone && (!markerExisted || existing.bootstrapRequired === true);

  writeJsonAtomic(markerPath, {
    ...restExisting,
    skillVersion,
    installedAt: new Date().toISOString(),
    mode,
    protocols: protocolList,
    ...(needsBootstrapRequired ? { bootstrapRequired: true } : {}),
    ...(choices.seed && choices.seed !== 'none' ? { seed: choices.seed } : {}),
  });
}

// ---------------------------------------------------------------------------
// Bootstrap materialization — runs when --bootstrap flag is used
// ---------------------------------------------------------------------------

const STACKSHIFT_UI_MD = `# StackShift UI — Component Standards

These conventions apply to every variant generated in this project.

## Import rules
- Always import the props interface from \`"."\` (the section index file), never from \`@stackshift-ui\`.
- Component library imports come from \`@stackshift-ui/<section>\`.

## Null handling
- Use \`?? undefined\` for every field extracted from \`data?.variants\`.
- Return \`null\` when required props are absent — never render a broken state.
- Use ternary guards (\`{title ? <Heading title={title} /> : null}\`) rather than \`&&\`.

## Function structure
- Default export: the main variant component.
- Named export: re-export the function (\`export { MySection_X }\`).
- Helper functions below all exports, not above.
- Defaults in destructure signature, not inside the function body.

## TypeScript
- All props optional (\`?\`) — Sanity data can always be null/undefined.
- No \`any\` types.
- Prefer composing existing interfaces over defining new ones.
`;

const BRAND_MD = `# Brand Standards

> Replace this starter with your project's actual brand guidelines.

## Voice and tone
[Describe writing register, formality, sentence structure guidelines]

## Color palette
[List named color roles: primary, secondary, neutral, accent — with usage rules]

## Typography
[Map heading levels to font / weight / size; describe body text defaults]

## Imagery
[Describe photography style, illustration tone, icon set restrictions]
`;

const FORGEIGNORE_CONTENT = `# StackShift — Sanity + Next.js defaults
studio/
.sanity/
.next/
dist/
build/
out/
coverage/

# UI Forge — Claude Design integration (regeneratable artifacts)
design/.handoff-cache/
design/claude-design-bundle/
`;

const REFERENCES_README = `# Custom References

Add custom reference lookups here for project-specific protocols.

These augment the skill's standard references without modifying them.

## Example

Create files like:
- \`custom-lookups.md\` - Custom data tables
- \`project-types.md\` - Project-specific type definitions
- \`field-patterns.md\` - Project field patterns
`;

export interface BootstrapResult {
  materialized: string[];
  created: string[];
  skipped: string[];
}

/**
 * Run protocol materialization and create project infrastructure.
 * Called when --bootstrap flag is used. Performs the file-system portions of
 * bootstrap/install.md Steps 5 and 8. UI Forge integration steps (Steps 6, 7b)
 * still require the AI agent at first invocation.
 */
export function runBootstrapMaterialization(
  choices: InstallChoices,
  allProtocols: ProtocolEntry[],
): BootstrapResult {
  const result: BootstrapResult = { materialized: [], created: [], skipped: [] };
  const cwd = process.cwd();

  // Build the selected protocol list
  const tierTiersMap: Record<ProtocolTier, Array<'required' | 'recommended' | 'optional'>> = {
    required: ['required'],
    recommended: ['required', 'recommended'],
    full: ['required', 'recommended', 'optional'],
    custom: ['required'],
  };
  let selectedProtocols = allProtocols.filter((p) =>
    tierTiersMap[choices.protocolTier].includes(p.tier),
  );
  if (choices.protocolTier === 'custom') {
    const extras = allProtocols.filter((p) => choices.customProtocols.includes(p.id));
    selectedProtocols = [...selectedProtocols, ...extras];
  }

  const protocolTargetDir = join(cwd, '.stackshift', 'protocol');
  const referencesTargetDir = join(cwd, '.stackshift', 'references');
  ensureDirSync(protocolTargetDir);

  // Step 5A — Materialize selected protocols
  for (const protocol of selectedProtocols) {
    if (protocol.file) {
      const src = join(protocolsDir, protocol.file);
      const dest = join(protocolTargetDir, protocol.file);
      if (pathExistsSync(dest)) {
        result.skipped.push(protocol.file);
      } else if (pathExistsSync(src)) {
        copySync(src, dest);
        result.materialized.push(protocol.file);
      }
    } else if (protocol.dir) {
      const src = join(protocolsDir, protocol.dir);
      const dest = join(protocolTargetDir, protocol.dir);
      if (pathExistsSync(dest)) {
        result.skipped.push(protocol.dir + '/');
      } else if (pathExistsSync(src)) {
        copySync(src, dest, { overwrite: true });
        result.materialized.push(protocol.dir + '/');
      }
    }
  }

  // Step 5B — Write project protocol registry
  const registryPath = join(protocolTargetDir, '_registry.json');
  if (!pathExistsSync(registryPath)) {
    writeJsonAtomic(registryPath, {
      protocols: [],
      note: 'Add custom project protocols here. They will be discovered alongside skill protocols.',
    });
    result.created.push('.stackshift/protocol/_registry.json');
  } else {
    result.skipped.push('.stackshift/protocol/_registry.json');
  }

  // Step 5C — Copy protocol template
  const templateSrc = join(protocolsDir, '_template');
  const templateDest = join(protocolTargetDir, '_template');
  if (!pathExistsSync(templateDest) && pathExistsSync(templateSrc)) {
    copySync(templateSrc, templateDest);
    result.created.push('.stackshift/protocol/_template/');
  } else if (pathExistsSync(templateDest)) {
    result.skipped.push('.stackshift/protocol/_template/');
  }

  // Step 5D — Create references directory
  ensureDirSync(referencesTargetDir);
  const referencesReadme = join(referencesTargetDir, 'README.md');
  if (!pathExistsSync(referencesReadme)) {
    writeFileSync(referencesReadme, REFERENCES_README, 'utf8');
    result.created.push('.stackshift/references/README.md');
  } else {
    result.skipped.push('.stackshift/references/README.md');
  }

  // Step 6f — Create design/standards/
  const designStandardsDir = join(cwd, 'design', 'standards');
  ensureDirSync(designStandardsDir);

  const stackshiftUiPath = join(designStandardsDir, 'stackshift-ui.md');
  if (!pathExistsSync(stackshiftUiPath)) {
    writeFileSync(stackshiftUiPath, STACKSHIFT_UI_MD, 'utf8');
    result.created.push('design/standards/stackshift-ui.md');
  } else {
    result.skipped.push('design/standards/stackshift-ui.md');
  }

  const hasBrandProtocol = selectedProtocols.some((p) => p.id === 'brand');
  if (hasBrandProtocol) {
    const brandPath = join(designStandardsDir, 'brand.md');
    if (!pathExistsSync(brandPath)) {
      writeFileSync(brandPath, BRAND_MD, 'utf8');
      result.created.push('design/standards/brand.md');
    } else {
      result.skipped.push('design/standards/brand.md');
    }
  }

  // Step 8 — Write .forgeignore if not exists
  const forgeignorePath = join(cwd, '.forgeignore');
  if (!pathExistsSync(forgeignorePath)) {
    writeFileSync(forgeignorePath, FORGEIGNORE_CONTENT, 'utf8');
    result.created.push('.forgeignore');
  } else {
    result.skipped.push('.forgeignore');
  }

  return result;
}

// ---------------------------------------------------------------------------

interface InstallResult {
  platform: Platform;
  skills: string[];
}

export function writeSelection(
  choices: InstallChoices,
  skills: SkillEntry[],
  allProtocols: ProtocolEntry[],
  options: { bootstrapDone?: boolean } = {},
): InstallResult[] {
  const results: InstallResult[] = [];
  const now = new Date().toISOString();

  // Detect all platforms where StackShift is already installed
  const installedPlatforms = getInstalledPlatforms(choices.scope);

  // Deduplicate on resolved path to avoid double-writes (e.g. gemini + agents share .agents/)
  const seenTargetDirs = new Set<string>();
  const allPlatformsToUpdate = new Set<Platform>([...choices.platforms, ...installedPlatforms]);

  const bundleName = choices.protocolTier === 'custom'
    ? 'stackshift-protocols-custom'
    : resolveProtocolSkillName(choices.protocolTier);

  for (const platform of allPlatformsToUpdate) {
    const targetDir = resolveTargetDir(choices.scope, platform);
    if (seenTargetDirs.has(targetDir)) continue;
    seenTargetDirs.add(targetDir);

    const lockPath = resolveLockPath(choices.scope, platform);
    ensureDirSync(targetDir);

    const installed: string[] = [];

    // Always install core
    const coreSkill = skills.find((s) => s.type === 'core');
    if (coreSkill) {
      copySkillFolder(coreSkill.folderPath, targetDir);
      appendLock(lockPath, { name: coreSkill.name, installedAt: now, scope: choices.scope });
      installed.push(coreSkill.name);
    }

    // When keeping the existing protocol tier, skip bundle cleanup and install
    if (!choices.keepProtocol) {
      cleanupOldProtocolBundles(targetDir, bundleName);
      cleanupLockFile(lockPath, bundleName);

      if (choices.protocolTier === 'custom') {
        buildCustomProtocolSkill(choices.customProtocols, allProtocols, targetDir);
        appendLock(lockPath, {
          name: 'stackshift-protocols-custom',
          installedAt: now,
          scope: choices.scope,
        });
        installed.push('stackshift-protocols-custom');
      } else {
        const bundleSkill = skills.find((s) => s.name === bundleName);
        if (bundleSkill) {
          copySkillFolder(bundleSkill.folderPath, targetDir);
          appendLock(lockPath, { name: bundleName, installedAt: now, scope: choices.scope });
          installed.push(bundleName);
        }
      }
    }

    results.push({ platform, skills: installed });
  }

  // Write .stackshift/installed.json
  writeStackshiftMarker(choices, allProtocols, options.bootstrapDone ?? false);

  return results;
}
