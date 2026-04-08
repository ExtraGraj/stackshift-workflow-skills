/**
 * Lock file architecture:
 *
 * - skills-lock.json: Source of truth for installed skills
 *   Location: .agents/skills-lock.json or .claude/skills-lock.json
 *   Purpose: Tracks which skills are installed and when
 *   Checked: On every install to detect existing tiers
 *
 * - .stackshift/installed.json: Bootstrap marker (project scope only)
 *   Location: .stackshift/installed.json (project root)
 *   Purpose: Tells AI agent bootstrap has run, stores selected mode
 *   Checked: Only by AI agent on first invocation, never by CLI
 *   Created: Only for project-scope installs (not global)
 *
 * Detection mechanism:
 *   - Reads both .agents/skills-lock.json and .claude/skills-lock.json
 *   - Finds entries starting with "stackshift-protocols-"
 *   - Returns first found, warns if different across platforms
 *
 * Dynamic behavior:
 *   - Yes, lock file updates when new tier installed
 *   - appendLock() filters out old entry by name before adding new one
 *   - Physical cleanup removes old bundle folders (if Enhancement 4 implemented)
 */

import { intro, outro, spinner, note } from '@clack/prompts';
import { join } from 'path';
import { homedir } from 'os';
import fsExtra from 'fs-extra';
const { pathExistsSync, readJsonSync } = fsExtra;
import { loadSkills, loadProtocolRegistry } from './registry.js';
import { runPrompts } from './prompts.js';
import { writeSelection } from './writer.js';
import { parseFlags, validateFlags, hasRequiredFlags, showHelp } from './flags.js';

interface LockEntry {
  name: string;
  installedAt: string;
  scope: 'project' | 'global';
}

interface LockFile {
  skills: LockEntry[];
}

function readLockFile(scope: 'project' | 'global', platform: 'agents' | 'claude'): LockFile | null {
  const baseDir = platform === 'agents' ? '.agents' : '.claude';
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
  // Check for flags (arguments after 'init' command)
  const args = process.argv.slice(3);
  const flags = parseFlags(args);

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  // Load registry (needed for both interactive and non-interactive)
  const s = spinner();
  s.start('Loading skill registry');
  const skills = loadSkills();
  const protocolRegistry = loadProtocolRegistry();
  s.stop('Registry loaded');

  // Non-interactive mode
  if (flags.noInteractive || hasRequiredFlags(flags)) {
    const choices = validateFlags(flags);
    if (!choices) {
      process.exit(1);
    }

    const s2 = spinner();
    s2.start('Installing skills');
    const results = writeSelection(choices, skills, protocolRegistry.protocols);
    s2.stop('Installation complete');

    if (results.length === 0) {
      outro('Nothing was installed.');
      return;
    }

    // Format output
    const platformLabels = choices.platforms.map(p => {
      const baseDir = p === 'agents' ? '.agents' : '.claude';
      return choices.scope === 'global' ? `~/${baseDir}/skills/` : `${baseDir}/skills/`;
    });

    const skillNames = results[0].skills;
    const summary = platformLabels.length === 1
      ? `Installed ${skillNames.length} skill(s) to ${platformLabels[0]}`
      : `Installed ${skillNames.length} skill(s) to ${platformLabels.length} platforms:\n` +
        platformLabels.map(label => `  → ${label}`).join('\n');

    outro(
      summary + '\n' +
        skillNames.map((name) => `  ✓ ${name}`).join('\n'),
    );
    return;
  }

  // Interactive mode
  intro('stackshift init — install StackShift skills');

  // Check for existing protocol bundle (try both platforms)
  const agentsLock = readLockFile('project', 'agents');
  const claudeLock = readLockFile('project', 'claude');

  const agentsBundle = agentsLock?.skills.find(s =>
    s.name.startsWith('stackshift-protocols-')
  );
  const claudeBundle = claudeLock?.skills.find(s =>
    s.name.startsWith('stackshift-protocols-')
  );

  const existingProtocolBundle = agentsBundle || claudeBundle;

  // Warn if different tiers across platforms
  if (agentsBundle && claudeBundle && agentsBundle.name !== claudeBundle.name) {
    note(
      `Different tiers detected:\n` +
      `  .agents: ${agentsBundle.name.replace('stackshift-protocols-', '')}\n` +
      `  .claude: ${claudeBundle.name.replace('stackshift-protocols-', '')}\n\n` +
      `This installation will replace BOTH.`,
      'Warning'
    );
  }

  const choices = await runPrompts(
    protocolRegistry.protocols,
    skills,
    protocolRegistry.seeds.length,
    existingProtocolBundle,
  );

  const results = writeSelection(choices, skills, protocolRegistry.protocols);

  if (results.length === 0) {
    outro('Nothing was installed.');
    return;
  }

  // Group results by platform for cleaner output
  const platformLabels = choices.platforms.map(p => {
    const baseDir = p === 'agents' ? '.agents' : '.claude';
    return choices.scope === 'global' ? `~/${baseDir}/skills/` : `${baseDir}/skills/`;
  });

  const skillNames = results[0].skills; // All platforms get same skills
  const summary = platformLabels.length === 1
    ? `Installed ${skillNames.length} skill(s) to ${platformLabels[0]}`
    : `Installed ${skillNames.length} skill(s) to ${platformLabels.length} platforms:\n` +
      platformLabels.map(label => `  → ${label}`).join('\n');

  outro(
    summary + '\n' +
      skillNames.map((name) => `  ✓ ${name}`).join('\n'),
  );
}
