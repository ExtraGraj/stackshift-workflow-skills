import { intro, outro, select, spinner } from '@clack/prompts';
import fsExtra from 'fs-extra';
const { readdirSync, pathExistsSync, removeSync, readJsonSync, writeJsonSync, readFileSync } = fsExtra;
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

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
  mode?: string;
  protocols?: Array<{ id: string; tier: string; file: string }>;
}

type Platform = 'agents' | 'claude';

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

/**
 * Scan both platforms for protocol bundle folders
 */
function scanForBundles(): Set<string> {
  const bundles = new Set<string>();
  const platforms: Platform[] = ['agents', 'claude'];

  for (const platform of platforms) {
    const baseDir = platform === 'agents' ? '.agents' : '.claude';
    const skillsDir = join(process.cwd(), baseDir, 'skills');

    if (pathExistsSync(skillsDir)) {
      try {
        const folders = readdirSync(skillsDir, { withFileTypes: true });
        for (const folder of folders) {
          if (folder.isDirectory() && folder.name.startsWith('stackshift-protocols-')) {
            bundles.add(folder.name);
          }
        }
      } catch {
        // Directory not readable, skip
      }
    }

    // Also check global
    const globalSkillsDir = join(homedir(), baseDir, 'skills');
    if (pathExistsSync(globalSkillsDir)) {
      try {
        const folders = readdirSync(globalSkillsDir, { withFileTypes: true });
        for (const folder of folders) {
          if (folder.isDirectory() && folder.name.startsWith('stackshift-protocols-')) {
            bundles.add(folder.name);
          }
        }
      } catch {
        // Directory not readable, skip
      }
    }
  }

  return bundles;
}

/**
 * Remove protocol bundle folders from all locations
 */
function removeBundleFromAllLocations(bundleName: string): void {
  const platforms: Platform[] = ['agents', 'claude'];
  const scopes: ('project' | 'global')[] = ['project', 'global'];

  for (const scope of scopes) {
    for (const platform of platforms) {
      const baseDir = platform === 'agents' ? '.agents' : '.claude';
      const skillsDir = scope === 'global'
        ? join(homedir(), baseDir, 'skills')
        : join(process.cwd(), baseDir, 'skills');

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
    writeJsonSync(lockPath, lock, { spaces: 2 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not update ${lockPath}: ${message}`);
  }
}

/**
 * Update all lock files across platforms and scopes
 */
function updateAllLockFiles(keepBundle: string): void {
  const platforms: Platform[] = ['agents', 'claude'];
  const scopes: ('project' | 'global')[] = ['project', 'global'];

  for (const scope of scopes) {
    for (const platform of platforms) {
      const baseDir = platform === 'agents' ? '.agents' : '.claude';
      const lockPath = scope === 'global'
        ? join(homedir(), baseDir, 'skills-lock.json')
        : join(process.cwd(), baseDir, 'skills-lock.json');

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
    let skillVersion = existing.protocols?.[0]?.tier || '0.1.0';
    try {
      skillVersion = readFileSync(skillVersionPath, 'utf8').trim();
    } catch { /* use existing */ }

    // Update the marker with new mode
    writeJsonSync(
      markerPath,
      {
        ...existing,
        skillVersion,
        mode: newMode,
        installedAt: new Date().toISOString(),
      },
      { spaces: 2 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Could not update .stackshift/installed.json: ${message}`);
  }
}

export async function repair(): Promise<void> {
  intro('stackshift repair — fix multi-tier installations');

  const s = spinner();
  s.start('Scanning for protocol bundles');

  const allBundles = scanForBundles();

  s.stop('Scan complete');

  if (allBundles.size === 0) {
    outro('⚠ No protocol bundles found. Run: npx @extragraj/stackshift-skills init');
    return;
  }

  if (allBundles.size === 1) {
    const [bundle] = allBundles;
    outro(`✓ Installation is valid. Only one protocol tier found: ${bundle.replace('stackshift-protocols-', '')}`);
    return;
  }

  // Multiple tiers found - ask which to keep
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
    // User cancelled
    outro('Cancelled');
    return;
  }

  const s2 = spinner();
  s2.start('Cleaning up protocol bundles');

  // Remove all except selected
  let removedCount = 0;
  for (const bundle of allBundles) {
    if (bundle !== keepTier) {
      removeBundleFromAllLocations(bundle);
      removedCount++;
    }
  }

  // Update all lock files
  updateAllLockFiles(keepTier as string);

  // Update .stackshift/installed.json to reflect the repaired tier
  updateInstalledMarker(keepTier as string);

  s2.stop('Cleanup complete');

  outro(
    `✓ Kept: ${keepTier}\n` +
    `  Removed ${removedCount} bundle(s): ${Array.from(allBundles).filter(b => b !== keepTier).map(b => b.replace('stackshift-protocols-', '')).join(', ')}\n` +
    `  Updated .stackshift/installed.json`
  );
}
