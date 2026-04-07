import { intro, outro, spinner } from '@clack/prompts';
import { loadSkills, loadProtocolRegistry } from './registry.js';
import { runPrompts } from './prompts.js';
import { writeSelection } from './writer.js';

export async function install(): Promise<void> {
  intro('stackshift init — install StackShift skills');

  const s = spinner();
  s.start('Loading skill registry');
  const skills = loadSkills();
  const protocolRegistry = loadProtocolRegistry();
  s.stop('Registry loaded');

  const choices = await runPrompts(
    protocolRegistry.protocols,
    skills,
    protocolRegistry.seeds.length,
  );

  const installed = writeSelection(choices, skills, protocolRegistry.protocols);

  if (installed.length === 0) {
    outro('Nothing was installed.');
    return;
  }

  const targetLabel =
    choices.scope === 'global' ? '~/.agents/skills/' : '.agents/skills/';

  outro(
    `Installed ${installed.length} skill(s) to ${targetLabel}\n` +
      installed.map((name) => `  ✓ ${name}`).join('\n'),
  );
}
