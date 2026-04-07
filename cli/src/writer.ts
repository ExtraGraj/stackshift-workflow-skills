import { writeFileSync } from 'fs';
import { copySync, ensureDirSync, readJsonSync, writeJsonSync, pathExistsSync, readFileSync } from 'fs-extra';
import { join, resolve, basename } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import type { InstallChoices, ProtocolTier } from './prompts.js';
import type { ProtocolEntry, SkillEntry } from './registry.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const skillsDir = resolve(__dirname, '../../skills');
const protocolsDir = resolve(__dirname, '../../skills/stackshift-core/protocols');
const skillVersionPath = resolve(__dirname, '../../skill.version');

const LOCK_FILE = 'skills-lock.json';

interface LockEntry {
  name: string;
  installedAt: string;
  scope: 'project' | 'global';
}

interface LockFile {
  skills: LockEntry[];
}

function resolveTargetDir(scope: 'project' | 'global'): string {
  if (scope === 'global') return join(homedir(), '.agents', 'skills');
  return join(process.cwd(), '.agents', 'skills');
}

function resolveLockPath(scope: 'project' | 'global'): string {
  if (scope === 'global') return join(homedir(), '.agents', LOCK_FILE);
  return join(process.cwd(), '.agents', LOCK_FILE);
}

function appendLock(lockPath: string, entry: LockEntry): void {
  let lock: LockFile = { skills: [] };
  if (pathExistsSync(lockPath)) {
    lock = readJsonSync(lockPath) as LockFile;
  }
  lock.skills = lock.skills.filter((s) => s.name !== entry.name);
  lock.skills.push(entry);
  writeJsonSync(lockPath, lock, { spaces: 2 });
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
    .map((p) => `| ${p.title} | \`protocols/${p.file}\` | — |`)
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

function writeStackshiftMarker(
  choices: InstallChoices,
  allProtocols: ProtocolEntry[],
): void {
  if (choices.scope !== 'project') return;

  const markerPath = join(process.cwd(), '.stackshift', 'installed.json');
  if (pathExistsSync(markerPath)) return;

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
  writeJsonSync(
    markerPath,
    {
      skillVersion,
      installedAt: new Date().toISOString(),
      mode: modeMap[choices.protocolTier],
      protocols: protocols.map(({ id, tier, file }) => ({ id, tier, file })),
      seeds: choices.seed === 'none' ? [] : [choices.seed],
    },
    { spaces: 2 },
  );
}

export function writeSelection(
  choices: InstallChoices,
  skills: SkillEntry[],
  allProtocols: ProtocolEntry[],
): string[] {
  const targetDir = resolveTargetDir(choices.scope);
  const lockPath = resolveLockPath(choices.scope);
  ensureDirSync(targetDir);

  const installed: string[] = [];
  const now = new Date().toISOString();

  // Always install core
  const coreSkill = skills.find((s) => s.type === 'core');
  if (coreSkill) {
    copySkillFolder(coreSkill.folderPath, targetDir);
    appendLock(lockPath, { name: coreSkill.name, installedAt: now, scope: choices.scope });
    installed.push(coreSkill.name);
  }

  // Install protocol bundle
  if (choices.protocolTier === 'custom') {
    buildCustomProtocolSkill(choices.customProtocols, allProtocols, targetDir);
    appendLock(lockPath, {
      name: 'stackshift-protocols-custom',
      installedAt: now,
      scope: choices.scope,
    });
    installed.push('stackshift-protocols-custom');
  } else {
    const bundleName = resolveProtocolSkillName(choices.protocolTier);
    const bundleSkill = skills.find((s) => s.name === bundleName);
    if (bundleSkill) {
      copySkillFolder(bundleSkill.folderPath, targetDir);
      appendLock(lockPath, { name: bundleName, installedAt: now, scope: choices.scope });
      installed.push(bundleName);
    }
  }

  // Write .stackshift/installed.json so bootstrap skips re-prompting (project scope only)
  writeStackshiftMarker(choices, allProtocols);

  return installed;
}
