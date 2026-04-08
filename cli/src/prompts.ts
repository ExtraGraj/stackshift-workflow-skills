import { select, multiselect, confirm, isCancel, cancel, note } from '@clack/prompts';
import type { ProtocolEntry, SkillEntry } from './registry.js';

export type ProtocolTier = 'required' | 'recommended' | 'full' | 'custom';
export type SeedChoice = 'none' | string;
export type ScopeChoice = 'project' | 'global';
export type Platform = 'agents' | 'claude';

export interface InstallChoices {
  protocolTier: ProtocolTier;
  customProtocols: string[];
  seed: SeedChoice;
  scope: ScopeChoice;
  platforms: Platform[];
}

function assertNotCancelled(value: unknown): asserts value is NonNullable<typeof value> {
  if (isCancel(value)) {
    cancel('Installation cancelled.');
    process.exit(0);
  }
}

export async function runPrompts(
  allProtocols: ProtocolEntry[],
  _skills: SkillEntry[],
  seedCount: number,
  existingBundle?: { name: string },
): Promise<InstallChoices> {
  // If protocol bundle already installed, warn user about replacement
  if (existingBundle) {
    const isCustom = existingBundle.name === 'stackshift-protocols-custom';
    const tierName = existingBundle.name.replace('stackshift-protocols-', '');

    const shouldReplace = await confirm({
      message: isCustom
        ? 'Custom protocol selection detected.\nReplace with a pre-built tier?'
        : `Protocol tier already installed: ${tierName}\nReplace with a different tier?`,
      initialValue: isCustom,
    });

    assertNotCancelled(shouldReplace);

    if (!shouldReplace) {
      cancel('Installation cancelled. Existing protocol tier kept.');
      process.exit(0);
    }
  }

  // Show that stackshift-core is always included
  note(
    'stackshift-core (workflow, protocols, references)',
    'Required package — always included'
  );
  const tierChoice = await select<ProtocolTier>({
    message: 'Select protocol tier:',
    options: [
      { value: 'required', label: 'Required only' },
      { value: 'recommended', label: 'Required + recommended', hint: 'recommended' },
      { value: 'full', label: 'All protocols (required + recommended + optional)' },
      { value: 'custom', label: 'Custom selection' },
    ],
    initialValue: 'recommended',
  });

  assertNotCancelled(tierChoice);

  let customProtocols: string[] = [];

  if (tierChoice === 'custom') {
    const selectableProtocols = allProtocols.filter(
      (p) => p.tier === 'recommended' || p.tier === 'optional',
    );

    const chosen = await multiselect<string>({
      message: 'Select additional protocols (required protocols included automatically):',
      options: selectableProtocols.map((p) => ({
        value: p.id,
        label: `[${p.tier}] ${p.id}`,
        hint: p.summary,
      })),
      required: false,
    });

    assertNotCancelled(chosen);
    customProtocols = chosen as string[];
  }

  // Seed step only shown when seeds are registered
  let seed: SeedChoice = 'none';
  if (seedCount > 0) {
    const seedChoice = await select<SeedChoice>({
      message: 'Select seeding strategy:',
      options: [{ value: 'none', label: 'None' }],
      initialValue: 'none',
    });
    assertNotCancelled(seedChoice);
    seed = seedChoice as SeedChoice;
  }

  const scopeChoice = await select<ScopeChoice>({
    message: 'Install location:',
    options: [
      { value: 'project', label: 'Project (.agents/skills/)', hint: 'recommended' },
      { value: 'global', label: 'Global (~/.agents/skills/)' },
    ],
    initialValue: 'project',
  });

  assertNotCancelled(scopeChoice);

  const platformChoices = await multiselect<Platform>({
    message: 'Select platform(s):',
    options: [
      { value: 'agents', label: 'General (.agents/)', hint: 'recommended' },
      { value: 'claude', label: 'Claude Code (.claude/)' },
    ],
    initialValues: ['agents'],
    required: true,
  });

  assertNotCancelled(platformChoices);

  return {
    protocolTier: tierChoice as ProtocolTier,
    customProtocols,
    seed,
    scope: scopeChoice as ScopeChoice,
    platforms: platformChoices as Platform[],
  };
}
