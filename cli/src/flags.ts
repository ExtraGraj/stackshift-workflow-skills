import type { InstallChoices, ProtocolTier, ScopeChoice, Platform } from './prompts.js';

export interface Flags {
  tier?: 'required' | 'recommended' | 'full';
  scope?: 'project' | 'global';
  platforms?: Platform[];
  seed?: string;
  noInteractive?: boolean;
  noMaterialize?: boolean;
  help?: boolean;
}

/**
 * Parse command-line flags from process.argv
 * Supports:
 *   --tier <required|recommended|full>
 *   --scope <project|global>
 *   --platform <agents|claude|copilot|gemini|cursor|comma-separated>
 *   --seed <id>
 *   --no-interactive
 *   --help
 */
export function parseFlags(args: string[]): Flags {
  const flags: Flags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        flags.help = true;
        break;

      case '--tier':
        if (i + 1 < args.length) {
          const tier = args[++i];
          if (tier === 'required' || tier === 'recommended' || tier === 'full') {
            flags.tier = tier;
          } else {
            console.error(`Invalid --tier value: ${tier}`);
            console.error('Valid values: required, recommended, full');
            process.exit(1);
          }
        }
        break;

      case '--scope':
        if (i + 1 < args.length) {
          const scope = args[++i];
          if (scope === 'project' || scope === 'global') {
            flags.scope = scope;
          } else {
            console.error(`Invalid --scope value: ${scope}`);
            console.error('Valid values: project, global');
            process.exit(1);
          }
        }
        break;

      case '--platform':
        if (i + 1 < args.length) {
          const platformArg = args[++i];
          const platforms = platformArg.split(',');
          const validPlatforms: Platform[] = [];
          const valid: Platform[] = ['agents', 'claude', 'copilot', 'gemini', 'cursor'];

          for (const p of platforms) {
            if (valid.includes(p as Platform)) {
              validPlatforms.push(p as Platform);
            } else {
              console.error(`Invalid --platform value: ${p}`);
              console.error('Valid values: agents, claude, copilot, gemini, cursor (or comma-separated)');
              process.exit(1);
            }
          }

          flags.platforms = validPlatforms;
        }
        break;

      case '--seed':
        if (i + 1 < args.length) {
          flags.seed = args[++i];
        }
        break;

      case '--no-materialize':
        flags.noMaterialize = true;
        break;

      case '--no-interactive':
        flags.noInteractive = true;
        break;

      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown flag: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  return flags;
}

/**
 * Check if non-interactive mode is active
 */
export function isNonInteractive(flags: Flags): boolean {
  return flags.noInteractive === true;
}

/**
 * Validate flags and convert to InstallChoices
 * Returns null if validation fails
 */
export function validateFlags(flags: Flags): InstallChoices | null {
  const tier = flags.tier || 'recommended';
  const scope: ScopeChoice = flags.scope || 'project';
  const platforms: Platform[] = flags.platforms || ['agents'];

  return {
    protocolTier: tier as ProtocolTier,
    customProtocols: [],
    seed: flags.seed ?? 'none',
    scope,
    platforms,
  };
}

/**
 * Show help text
 */
export function showHelp(): void {
  console.log(`
StackShift CLI - Install StackShift skills for composable Sanity page-builder

USAGE:
  npx @extragraj/stackshift-skills init [OPTIONS]
  npx @extragraj/stackshift-skills repair

COMMANDS:
  init      Install StackShift skills (default)
  repair    Fix multi-tier installations

OPTIONS:
  --tier <required|recommended|full>    Protocol tier (default: recommended)
  --scope <project|global>              Install location (default: project)
  --platform <platform>                 Platform(s) (default: agents)
                                        Values: claude, agents, copilot, gemini, cursor
                                        Use comma-separated for multiple: claude,agents
  --seed <id|none>                      Seeding strategy id, or 'none' (default: none)
                                        Example: --seed initialvalue-seeding
  --no-materialize                      Skip CLI materialization; defer all steps to AI agent.
                                        Useful for fully automated flows.
  --no-interactive                      Skip prompts, use flags + defaults
  --help, -h                            Show this help

PLATFORM SKILL ROOTS:
  claude    Claude Code         .claude/skills/         ~/.claude/skills/
  copilot   GitHub Copilot      .github/skills/         ~/.copilot/skills/
  agents    OpenAI Codex / All  .agents/skills/         ~/.agents/skills/
  gemini    Google Gemini       .agents/skills/         ~/.gemini/antigravity/skills/
  cursor    Cursor IDE          .cursor/skills/         ~/.cursor/skills/

EXAMPLES:
  # Interactive installation (recommended)
  npx @extragraj/stackshift-skills init

  # Non-interactive with defaults
  npx @extragraj/stackshift-skills init --no-interactive

  # Non-interactive with specific options
  npx @extragraj/stackshift-skills init --tier full --scope project --platform agents --no-interactive

  # Install to multiple platforms
  npx @extragraj/stackshift-skills init --platform claude,agents --no-interactive

  # Fix multi-tier installation
  npx @extragraj/stackshift-skills repair

NOTES:
  - stackshift-core is always installed (required for workflow)
  - Custom tier selection requires interactive mode
  - Protocol tiers are cumulative (full includes recommended + required)
  - Without --no-materialize, the CLI materializes protocols to .stackshift/ non-interactively;
    UI Forge integration steps still require the AI agent
  `);
}