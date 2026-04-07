import { select, multiselect, isCancel, cancel } from '@clack/prompts';
import type { ProtocolEntry, SkillEntry } from './registry.js';

export type ProtocolTier = 'required' | 'recommended' | 'full' | 'custom';
export type SeedChoice = 'none' | string;
export type ScopeChoice = 'project' | 'global';

export interface InstallChoices {
  protocolTier: ProtocolTier;
  customProtocols: string[];
  seed: SeedChoice;
  scope: ScopeChoice;
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
): Promise<InstallChoices> {
  const tierChoice = await select<ProtocolTier>({
    message: 'Which protocols would you like to install?',
    options: [
      { value: 'required', label: 'Required only' },
      { value: 'recommended', label: 'Required + Recommended', hint: 'default' },
      { value: 'full', label: 'All (including optional)' },
      { value: 'custom', label: 'Custom' },
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
      message: 'Required protocols are included automatically.\nSelect additional protocols:',
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
      message: 'Which seeding strategy would you like to install?',
      options: [{ value: 'none', label: 'None' }],
      initialValue: 'none',
    });
    assertNotCancelled(seedChoice);
    seed = seedChoice;
  }

  const scopeChoice = await select<ScopeChoice>({
    message: 'Install to:',
    options: [
      { value: 'project', label: 'Project  (.agents/skills/)', hint: 'default' },
      { value: 'global', label: 'Global   (~/.agents/skills/)' },
    ],
    initialValue: 'project',
  });

  assertNotCancelled(scopeChoice);

  return {
    protocolTier: tierChoice,
    customProtocols,
    seed,
    scope: scopeChoice,
  };
}
