import { intro, outro, select, spinner, note } from '@clack/prompts';
import fsExtra from 'fs-extra';
const { readdirSync, pathExistsSync, removeSync, readJsonSync, writeJsonSync, readFileSync } = fsExtra;
import { renameSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { loadSeedRegistry } from './registry.js';
import type { SeedEntry } from './registry.js';

/**
 * Atomic JSON write: write to a `.tmp` file, then rename.
 * Prevents lock-file corruption if the process is killed mid-write.
 */
function writeJsonAtomic(filePath: string, data: unknown): void {
  const tmpPath = `${filePath}.tmp`;
  writeJsonSync(tmpPath, data, { spaces: 2 });
  renameSync(tmpPath, filePath);
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const skillVersionPath = resolve(__dirname, '../../skill.version');

interface LockEntry {
  name: string;
  installedAt: string;
  scope: 'project' | 'global';
}

interface LockFile {
  skills: LockEntry[];
}

interface InstalledJson {
  skillVersion?: string;
  mode?: string;
  protocols?: Array<{ id: string; tier: string; file?: string; dir?: string }>;
  seed?: string;
}

type Platform = 'agents' | 'claude' | 'copilot' | 'gemini' | 'cursor';

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
  gemini: '.gemini/antigravity',
  cursor: '.cursor',
};

/**
 * Read intended tier from .stackshift/installed.json
 * Returns null if file doesn't exist or is invalid
 */
function readIntendedTier(): string | null {
  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');
  if (!pathExistsSync(markerPath)) return null;

  try {
    const data = readJsonSync(markerPath) as InstalledJson;
    const modeMap: Record<string, string> = {
      required: 'stackshift-protocols-required',
      recommended: 'stackshift-protocols-recommended',
      all: 'stackshift-protocols-full',
      interactive: 'stackshift-protocols-custom',
    };
    return data.mode ? modeMap[data.mode] || null : null;
  } catch {
    return null;
  }
}

function readInstalledSeed(): string | undefined {
  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');
  if (!pathExistsSync(markerPath)) return undefined;
  try {
    const data = readJsonSync(markerPath) as InstalledJson;
    return data.seed ?? undefined;
  } catch {
    return undefined;
  }
}

function scanSkillsDir(dir: string, match: (name: string) => boolean): string[] {
  if (!pathExistsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.isDirectory() && match(f.name))
      .map((f) => f.name);
  } catch {
    return [];
  }
}

/**
 * Scan all platforms and both scopes for protocol bundle folders
 */
function scanForBundles(): Set<string> {
  const bundles = new Set<string>();
  const seenDirs = new Set<string>();
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];

  for (const platform of allPlatforms) {
    for (const [baseDir, root] of [
      [PLATFORM_PROJECT_DIR[platform], process.cwd()],
      [PLATFORM_GLOBAL_DIR[platform], homedir()],
    ] as [string, string][]) {
      const skillsDir = join(root, baseDir, 'skills');
      if (seenDirs.has(skillsDir)) continue;
      seenDirs.add(skillsDir);
      for (const name of scanSkillsDir(skillsDir, (n) => n.startsWith('stackshift-protocols-'))) {
        bundles.add(name);
      }
    }
  }

  return bundles;
}

/**
 * Scan all platforms and both scopes for stackshift-seed-* folders
 */
function scanForSeedFolders(): Set<string> {
  const seeds = new Set<string>();
  const seenDirs = new Set<string>();
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];

  for (const platform of allPlatforms) {
    for (const [baseDir, root] of [
      [PLATFORM_PROJECT_DIR[platform], process.cwd()],
      [PLATFORM_GLOBAL_DIR[platform], homedir()],
    ] as [string, string][]) {
      const skillsDir = join(root, baseDir, 'skills');
      if (seenDirs.has(skillsDir)) continue;
      seenDirs.add(skillsDir);
      for (const name of scanSkillsDir(skillsDir, (n) => n.startsWith('stackshift-seed-'))) {
        seeds.add(name);
      }
    }
  }

  return seeds;
}

/**
 * Remove protocol bundle folders from all locations
 */
function removeBundleFromAllLocations(bundleName: string): void {
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];
  const seenDirs = new Set<string>();

  for (const platform of allPlatforms) {
    for (const [baseDir, root] of [
      [PLATFORM_PROJECT_DIR[platform], process.cwd()],
      [PLATFORM_GLOBAL_DIR[platform], homedir()],
    ] as [string, string][]) {
      const skillsDir = join(root, baseDir, 'skills');
      if (seenDirs.has(skillsDir)) continue;
      seenDirs.add(skillsDir);
      const bundlePath = join(skillsDir, bundleName);
      if (pathExistsSync(bundlePath)) {
        try {
          removeSync(bundlePath);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`Warning: Could not remove ${bundlePath}: ${message}`);
        }
      }
    }
  }
}

/**
 * Remove seed folders from all locations
 */
function removeSeedFromAllLocations(folderName: string): void {
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];
  const seenDirs = new Set<string>();

  for (const platform of allPlatforms) {
    for (const [baseDir, root] of [
      [PLATFORM_PROJECT_DIR[platform], process.cwd()],
      [PLATFORM_GLOBAL_DIR[platform], homedir()],
    ] as [string, string][]) {
      const skillsDir = join(root, baseDir, 'skills');
      if (seenDirs.has(skillsDir)) continue;
      seenDirs.add(skillsDir);
      const folderPath = join(skillsDir, folderName);
      if (pathExistsSync(folderPath)) {
        try {
          removeSync(folderPath);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`Warning: Could not remove ${folderPath}: ${message}`);
        }
      }
    }
  }
}

/**
 * Clean lock file to keep only selected tier
 */
function cleanLockFile(lockPath: string, keepBundle: string): void {
  if (!pathExistsSync(lockPath)) return;

  try {
    const lock = readJsonSync(lockPath) as LockFile;
    // Remove all protocol bundle entries except the one to keep
    lock.skills = lock.skills.filter(
      (s) => !s.name.startsWith('stackshift-protocols-') || s.name === keepBundle
    );
    writeJsonAtomic(lockPath, lock);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not update ${lockPath}: ${message}`);
  }
}

/**
 * Update all lock files across platforms and scopes
 */
function updateAllLockFiles(keepBundle: string): void {
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];
  const seenLocks = new Set<string>();

  for (const platform of allPlatforms) {
    for (const [baseDir, root] of [
      [PLATFORM_PROJECT_DIR[platform], process.cwd()],
      [PLATFORM_GLOBAL_DIR[platform], homedir()],
    ] as [string, string][]) {
      const lockPath = join(root, baseDir, 'skills-lock.json');
      if (seenLocks.has(lockPath)) continue;
      seenLocks.add(lockPath);
      cleanLockFile(lockPath, keepBundle);
    }
  }
}

/**
 * Update .stackshift/installed.json to reflect the repaired tier
 */
function updateInstalledMarker(keepBundle: string): void {
  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');

  // Only update if it exists (project scope installations)
  if (!pathExistsSync(markerPath)) return;

  try {
    const existing = readJsonSync(markerPath) as InstalledJson;

    // Map bundle name to mode
    const bundleToMode: Record<string, string> = {
      'stackshift-protocols-required': 'required',
      'stackshift-protocols-recommended': 'recommended',
      'stackshift-protocols-full': 'all',
      'stackshift-protocols-custom': 'interactive',
    };

    const newMode = bundleToMode[keepBundle] || existing.mode;

    // Read current version
    let skillVersion = existing.skillVersion || '0.1.0';
    try {
      skillVersion = readFileSync(skillVersionPath, 'utf8').trim();
    } catch { /* use existing */ }

    // Update the marker with new mode
    writeJsonAtomic(markerPath, {
      ...existing,
      skillVersion,
      mode: newMode,
      installedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not update .stackshift/installed.json: ${message}`);
  }
}

/**
 * Update .stackshift/installed.json seed field.
 * Pass undefined to remove the seed field (no active seed).
 */
function updateInstalledSeed(seedId: string | undefined): void {
  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');
  if (!pathExistsSync(markerPath)) return;

  try {
    const existing = readJsonSync(markerPath) as InstalledJson;

    // Remove seed key then conditionally re-add
    const { seed: _removed, ...rest } = existing;
    const updated = seedId ? { ...rest, seed: seedId } : rest;

    writeJsonAtomic(markerPath, updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not update seed in .stackshift/installed.json: ${message}`);
  }
}

/**
 * Given a folder name like "stackshift-seed-initialvalue", find the matching registry entry.
 * Convention: folder = "stackshift-seed-" + id.replace(/-seeding$/, "")
 */
function findSeedEntryByFolder(folderName: string, registry: SeedEntry[]): SeedEntry | undefined {
  return registry.find((s) => {
    const expectedFolder = `stackshift-seed-${s.id.replace(/-seeding$/, '')}`;
    return expectedFolder === folderName;
  });
}

/**
 * Given a seed folder name, return its expected installed.json id from the registry.
 * Returns undefined when no registry entry matches.
 */
function deriveSeedId(folderName: string, registry: SeedEntry[]): string | undefined {
  return findSeedEntryByFolder(folderName, registry)?.id;
}

export async function repair(): Promise<void> {
  intro('StackShift Skills Repair');

  const s = spinner();
  s.start('Scanning for protocol bundles and seed folders');

  const allBundles = scanForBundles();
  const allSeedFolders = scanForSeedFolders();

  s.stop('Scan complete');

  const outroLines: string[] = [];

  // ── Protocol bundle repair ──────────────────────────────────────────────────

  if (allBundles.size === 0) {
    outroLines.push('⚠ No protocol bundles found. Run: npx @extragraj/stackshift-skills init');
  } else if (allBundles.size === 1) {
    const [bundle] = allBundles;
    outroLines.push(`✓ Protocol tier: ${bundle.replace('stackshift-protocols-', '')} (valid)`);
  } else {
    // Multiple tiers found — ask which to keep
    const intendedTier = readIntendedTier();

    const keepTier = await select({
      message: `Multiple protocol tiers found (${allBundles.size} bundles). Which should we keep?`,
      options: Array.from(allBundles)
        .sort()
        .map((name) => ({
          value: name,
          label: name.replace('stackshift-protocols-', ''),
          hint: name === intendedTier ? 'from .stackshift/installed.json' : undefined,
        })),
    });

    if (typeof keepTier === 'symbol') {
      outro('Cancelled');
      return;
    }

    const s2 = spinner();
    s2.start('Cleaning up protocol bundles');

    let removedCount = 0;
    for (const bundle of allBundles) {
      if (bundle !== keepTier) {
        removeBundleFromAllLocations(bundle);
        removedCount++;
      }
    }

    updateAllLockFiles(keepTier as string);
    updateInstalledMarker(keepTier as string);

    s2.stop('Protocol cleanup complete');

    outroLines.push(
      `✓ Protocol tier fixed: kept ${(keepTier as string).replace('stackshift-protocols-', '')}, ` +
      `removed ${removedCount} bundle(s)\n` +
      `  Updated .stackshift/installed.json`
    );
  }

  // ── Seed repair ─────────────────────────────────────────────────────────────

  const seedRegistry = loadSeedRegistry();
  const recordedSeed = readInstalledSeed();

  if (allSeedFolders.size === 0 && !recordedSeed) {
    outroLines.push('✓ No seeding strategy active (none selected)');
  } else if (allSeedFolders.size === 0 && recordedSeed) {
    note(
      `installed.json records seed "${recordedSeed}" but no stackshift-seed-* folder was found.\n` +
      `Run: npx skills add extragraj/stackshift-workflow-skills to reinstall,\n` +
      `or run: npx @extragraj/stackshift-skills init to change or clear the selection.`,
      'Seed warning'
    );
    outroLines.push(`⚠ Seed "${recordedSeed}" recorded but not installed as a folder`);
  } else if (allSeedFolders.size === 1) {
    const [folder] = allSeedFolders;
    const entry = findSeedEntryByFolder(folder, seedRegistry);

    if (!entry) {
      note(
        `Seed folder "${folder}" is not in the current skill registry.\n` +
        `It may be from an older version. Run init to re-select.`,
        'Seed validation warning'
      );
      outroLines.push(`⚠ Seed folder "${folder}" — not found in registry`);
    } else {
      // Sync installed.json seed field if out of sync
      if (recordedSeed !== entry.id) {
        updateInstalledSeed(entry.id);
        outroLines.push(`✓ Seed: ${folder.replace('stackshift-seed-', '')} (valid — synced installed.json)`);
      } else {
        outroLines.push(`✓ Seed: ${folder.replace('stackshift-seed-', '')} (valid)`);
      }
    }
  } else {
    // Multiple seed folders — ask which to keep
    const intendedSeedFolder = recordedSeed
      ? `stackshift-seed-${recordedSeed.replace(/-seeding$/, '')}`
      : undefined;

    const keepSeed = await select({
      message: `Multiple seed strategies found (${allSeedFolders.size}). Which should we keep?`,
      options: Array.from(allSeedFolders)
        .sort()
        .map((name) => ({
          value: name,
          label: name.replace('stackshift-seed-', ''),
          hint: name === intendedSeedFolder ? 'from .stackshift/installed.json' : undefined,
        })),
    });

    if (typeof keepSeed === 'symbol') {
      outro('Cancelled');
      return;
    }

    const s3 = spinner();
    s3.start('Cleaning up seed folders');

    let removedSeedCount = 0;
    for (const folder of allSeedFolders) {
      if (folder !== keepSeed) {
        removeSeedFromAllLocations(folder);
        removedSeedCount++;
      }
    }

    const newSeedId = deriveSeedId(keepSeed as string, seedRegistry);
    updateInstalledSeed(newSeedId);

    s3.stop('Seed cleanup complete');

    outroLines.push(
      `✓ Seed fixed: kept ${(keepSeed as string).replace('stackshift-seed-', '')}, ` +
      `removed ${removedSeedCount} folder(s)\n` +
      `  Updated .stackshift/installed.json`
    );
  }

  // Validate recorded seed against registry (always runs)
  if (recordedSeed && !seedRegistry.some((s) => s.id === recordedSeed)) {
    note(
      `Active seed "${recordedSeed}" in .stackshift/installed.json is not in the skill registry.\n` +
      `Run: npx @extragraj/stackshift-skills init to select a valid seed.`,
      'Seed validation warning'
    );
  }

  outro(outroLines.join('\n'));
}
