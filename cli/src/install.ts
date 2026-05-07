/**
 * Lock file architecture:
 *
 * - .stackshift/installed.json: SOURCE OF TRUTH for protocol tier selection
 *   Location: .stackshift/installed.json (project root)
 *   Purpose: Records which tier was selected (mode: required/recommended/all/interactive)
 *            CLI sets bootstrapRequired: true on fresh installs so the agent runs bootstrap.
 *            CLI with --bootstrap materializes protocols itself (no bootstrapRequired written).
 *   Updated: On every install or repair to keep tier selection current
 *   Used by: AI agent for bootstrap, CLI for detecting tier changes
 *   Scope: Project-scope installs only (not global)
 *
 * - skills-lock.json: Installation record per platform
 *   Location: <platform-dir>/skills-lock.json (one per platform)
 *   Purpose: Tracks which skills are physically installed on each platform
 *   Updated: On every install to each platform
 *   Used by: CLI for detecting existing installations
 *
 * Tier change detection:
 *   - Reads skills-lock.json for all supported platforms
 *   - Finds entries starting with "stackshift-protocols-"
 *   - Returns first found, warns if different across platforms
 *
 * Cross-platform sync:
 *   - When tier changes, ALL platforms with StackShift are updated
 *   - Even if user selects only one platform, all existing installations sync
 *   - Old bundle folders removed from all platforms
 *   - Lock files updated for all platforms
 */

import { intro, outro, spinner, note } from '@clack/prompts';
import { join } from 'path';
import { homedir } from 'os';
import fsExtra from 'fs-extra';
const { pathExistsSync, readJsonSync } = fsExtra;
import { loadSkills, loadProtocolRegistry } from './registry.js';
import { runPrompts } from './prompts.js';
import { writeSelection, runBootstrapMaterialization } from './writer.js';
import { parseFlags, validateFlags, isNonInteractive, showHelp } from './flags.js';
import type { Platform, InstallChoices } from './prompts.js';

const PLATFORM_PROJECT_DIR: Record<Platform, string> = {
  claude: '.claude',
  agents: '.agents',
  copilot: '.github',
  gemini: '.agents',
  cursor: '.cursor',
};

function resolveTargetDir(scope: 'project' | 'global', platform: Platform): string {
  const baseDir = PLATFORM_PROJECT_DIR[platform];
  if (scope === 'global') return join(homedir(), baseDir, 'skills');
  return join(process.cwd(), baseDir, 'skills');
}

/**
 * Verify that stackshift-core landed on disk for each platform in the install results.
 */
function validateWriteResults(
  choices: InstallChoices,
  results: Array<{ platform: Platform; skills: string[] }>,
): void {
  const seenDirs = new Set<string>();
  for (const result of results) {
    const targetDir = resolveTargetDir(choices.scope, result.platform);
    if (seenDirs.has(targetDir)) continue;
    seenDirs.add(targetDir);
    const coreDir = join(targetDir, 'stackshift-core');
    if (!pathExistsSync(coreDir)) {
      console.error(
        `Error: Skills not found at ${targetDir} after installation.\n` +
        `Check filesystem permissions and try again.`,
      );
      process.exit(1);
    }
  }
}

/**
 * Emit a note when extra platforms were synced beyond what the user selected.
 */
function reportCrossPlatformSync(
  choices: InstallChoices,
  results: Array<{ platform: Platform; skills: string[] }>,
): void {
  const extraPlatforms = results
    .filter((r) => !choices.platforms.includes(r.platform))
    .map((r) => r.platform);

  if (extraPlatforms.length === 0) return;

  const dirMap: Record<Platform, string> = {
    claude: '.claude/', agents: '.agents/', copilot: '.github/',
    gemini: '.agents/ (gemini)', cursor: '.cursor/',
  };
  const labels = extraPlatforms.map((p) => dirMap[p]).join(', ');

  note(
    `Also synced: ${labels}\n` +
    `(Existing installation detected — kept in sync)`,
    'Cross-platform sync',
  );
}

interface LockEntry {
  name: string;
  installedAt: string;
  scope: 'project' | 'global';
}

interface LockFile {
  skills: LockEntry[];
}

function readExistingSeed(): string | undefined {
  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');
  if (!pathExistsSync(markerPath)) return undefined;
  try {
    const data = readJsonSync(markerPath) as { seed?: string };
    return data.seed ?? undefined;
  } catch {
    return undefined;
  }
}

function readLockFile(scope: 'project' | 'global', platform: Platform): LockFile | null {
  const baseDir = PLATFORM_PROJECT_DIR[platform];
  const lockPath = scope === 'global'
    ? join(homedir(), baseDir, 'skills-lock.json')
    : join(process.cwd(), baseDir, 'skills-lock.json');

  if (!pathExistsSync(lockPath)) return null;
  try {
    return readJsonSync(lockPath) as LockFile;
  } catch {
    return null;
  }
}

export async function install(): Promise<void> {
  const args = process.argv.slice(3);
  const flags = parseFlags(args);

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  const isInteractive = !flags.noInteractive && !isNonInteractive(flags);
  if (isInteractive) {
    intro('StackShift Skills Installation');
  }

  const s = spinner();
  s.start('Loading registry...');
  const skills = loadSkills();
  const protocolRegistry = loadProtocolRegistry();
  s.stop('Registry loaded');

  // Non-interactive mode
  if (!isInteractive) {
    const choices = validateFlags(flags);
    if (!choices) {
      process.exit(1);
    }

    // Determine if we should materialize (default: yes, unless --no-materialize is set)
    const shouldMaterialize = !flags.noMaterialize;

    const s2 = spinner();
    s2.start('Installing...');
    const results = writeSelection(choices, skills, protocolRegistry.protocols, {
      materializationDone: shouldMaterialize,
    });
    s2.stop('Installation complete');

    if (results.length === 0) {
      outro('Nothing was installed.');
      return;
    }

    validateWriteResults(choices, results);
    reportCrossPlatformSync(choices, results);

    // Run bootstrap materialization by default (unless --no-materialize is set)
    if (shouldMaterialize) {
      const bs = spinner();
      bs.start('Running materialization...');
      const bsResult = runBootstrapMaterialization(choices, protocolRegistry.protocols);
      bs.stop('Materialization complete');

      const lines: string[] = [];
      if (bsResult.materialized.length > 0)
        lines.push(`Materialized: ${bsResult.materialized.join(', ')}`);
      if (bsResult.created.length > 0)
        lines.push(`Created: ${bsResult.created.join(', ')}`);
      if (bsResult.updated.length > 0)
        lines.push(`Updated: ${bsResult.updated.join(', ')}`);
      if (bsResult.removed.length > 0)
        lines.push(`Removed (stale): ${bsResult.removed.join(', ')}`);
      if (bsResult.skipped.length > 0)
        lines.push(`Skipped (already exists): ${bsResult.skipped.join(', ')}`);

      const removedNote = bsResult.removed.length > 0
        ? `\n   • Removed ${bsResult.removed.length} stale protocol(s): ${bsResult.removed.join(', ')}`
        : '';

      note(
        '✅ Materialization complete (CLI phase)\n' +
        '   • Protocols materialized to .stackshift/protocols/\n' +
        '   • Project registries created\n' +
        '   • design/standards/ initialized\n' +
        '   • .forgeignore written' +
        removedNote,
        'Materialization',
      );
      note(
        '⏳ Remaining bootstrap steps (require AI agent):\n' +
        '   • UI Forge detection & integration\n' +
        '   • design-arch.json bridging\n' +
        '   • PostToolUse hook installation\n\n' +
        '→ Run your AI agent to complete bootstrap',
        'Next steps',
      );
    } else {
      note(
        'All bootstrap steps (file materialization, UI Forge integration, hooks)\n' +
        'will run on first AI agent invocation.\n\n' +
        'To materialize files later, run: npx @extragraj/stackshift-skills init',
        'Bootstrap deferred',
      );
    }

    const platformLabels = choices.platforms.map((p) => {
      const baseDir = PLATFORM_PROJECT_DIR[p];
      return choices.scope === 'global' ? `~/${baseDir}/skills/` : `${baseDir}/skills/`;
    });

    const skillNames = results[0].skills;
    const summary = platformLabels.length === 1
      ? `Installed ${skillNames.length} skill(s) to ${platformLabels[0]}`
      : `Installed ${skillNames.length} skill(s) to ${platformLabels.length} platforms:\n` +
        platformLabels.map((label) => `  → ${label}`).join('\n');

    outro(
      summary + '\n' +
        skillNames.map((name) => `  ✓ ${name}`).join('\n'),
    );
    return;
  }

  // Interactive mode — intro already shown above

  // Check for existing protocol bundle across all platforms
  const allPlatforms: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];
  const lockFiles = allPlatforms
    .map((p) => ({ platform: p, lock: readLockFile('project', p) }))
    .filter((e) => e.lock !== null);

  const bundleEntries = lockFiles.flatMap((e) =>
    (e.lock?.skills ?? [])
      .filter((s) => s.name.startsWith('stackshift-protocols-'))
      .map((s) => ({ label: PLATFORM_PROJECT_DIR[e.platform], name: s.name })),
  );

  const existingProtocolBundle = bundleEntries.length > 0 ? bundleEntries[0] : undefined;

  // Warn if different tiers detected across platforms
  const uniqueBundleNames = new Set(bundleEntries.map((b) => b.name));
  if (bundleEntries.length > 1 && uniqueBundleNames.size > 1) {
    note(
      `Different tiers detected:\n` +
      bundleEntries
        .map((b) => `  ${b.label}: ${b.name.replace('stackshift-protocols-', '')}`)
        .join('\n') +
      `\n\nThis installation will replace ${bundleEntries.length === 2 ? 'BOTH' : 'ALL'}.`,
      'Warning',
    );
  }

  const existingSeed = readExistingSeed();

  const choices = await runPrompts(
    protocolRegistry.protocols,
    skills,
    protocolRegistry.seeds,
    existingProtocolBundle,
    existingSeed,
  );

  // Determine if we should materialize (default: yes, unless --no-materialize is set)
  const shouldMaterialize = !flags.noMaterialize;

  const s3 = spinner();
  s3.start('Installing...');
  const results = writeSelection(choices, skills, protocolRegistry.protocols, {
    materializationDone: shouldMaterialize,
  });
  s3.stop('Installation complete');

  if (results.length === 0) {
    outro('Nothing was installed.');
    return;
  }

  validateWriteResults(choices, results);
  reportCrossPlatformSync(choices, results);

  // Run bootstrap materialization by default (unless --no-materialize is set)
  if (shouldMaterialize) {
    const bs = spinner();
    bs.start('Running materialization...');
    const bsResult = runBootstrapMaterialization(choices, protocolRegistry.protocols);
    bs.stop('Materialization complete');

    const lines: string[] = [];
    if (bsResult.materialized.length > 0)
      lines.push(`Materialized: ${bsResult.materialized.join(', ')}`);
    if (bsResult.created.length > 0)
      lines.push(`Created: ${bsResult.created.join(', ')}`);
    if (bsResult.updated.length > 0)
      lines.push(`Updated: ${bsResult.updated.join(', ')}`);
    if (bsResult.removed.length > 0)
      lines.push(`Removed (stale): ${bsResult.removed.join(', ')}`);
    if (bsResult.skipped.length > 0)
      lines.push(`Skipped (already exists): ${bsResult.skipped.join(', ')}`);

    const removedNote = bsResult.removed.length > 0
      ? `\n   • Removed ${bsResult.removed.length} stale protocol(s): ${bsResult.removed.join(', ')}`
      : '';

    note(
      '✅ Materialization complete (CLI phase)\n' +
      '   • Protocols materialized to .stackshift/protocols/\n' +
      '   • Project registries created\n' +
      '   • design/standards/ initialized\n' +
      '   • .forgeignore written' +
      removedNote,
      'Materialization',
    );
    note(
      '⏳ Remaining bootstrap steps (require AI agent):\n' +
      '   • UI Forge detection & integration\n' +
      '   • design-arch.json bridging\n' +
      '   • PostToolUse hook installation\n\n' +
      '→ Run your AI agent to complete bootstrap',
      'Next steps',
    );
  } else {
    note(
      'All bootstrap steps (file materialization, UI Forge integration, hooks)\n' +
      'will run on first AI agent invocation.\n\n' +
      'To materialize files later, run: npx @extragraj/stackshift-skills init',
      'Bootstrap deferred',
    );
  }

  const platformLabels = choices.platforms.map((p) => {
    const baseDir = PLATFORM_PROJECT_DIR[p];
    return choices.scope === 'global' ? `~/${baseDir}/skills/` : `${baseDir}/skills/`;
  });

  const skillNames = results[0].skills;
  const summary = platformLabels.length === 1
    ? `Installed ${skillNames.length} skill(s) to ${platformLabels[0]}`
    : `Installed ${skillNames.length} skill(s) to ${platformLabels.length} platforms:\n` +
      platformLabels.map((label) => `  → ${label}`).join('\n');

  outro(
    summary + '\n' +
      skillNames.map((name) => `  ✓ ${name}`).join('\n') + '\n\n' +
      'Run your AI agent in this project to complete bootstrap\n' +
      '(protocol materialization, design/standards/, UI Forge integration).',
  );
}
