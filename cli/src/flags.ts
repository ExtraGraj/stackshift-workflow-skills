import type { InstallChoices, ProtocolTier, ScopeChoice, Platform } from './prompts.js';

export interface Flags {
  tier?: 'required' | 'recommended' | 'full';
  scope?: 'project' | 'global';
  platforms?: ('agents' | 'claude')[];
  noInteractive?: boolean;
  help?: boolean;
}

/**
 * Parse command-line flags from process.argv
 * Supports:
 *   --tier <required|recommended|full>
 *   --scope <project|global>
 *   --platform <agents|claude|agents,claude>
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

          for (const p of platforms) {
            if (p === 'agents' || p === 'claude') {
              validPlatforms.push(p);
            } else {
              console.error(`Invalid --platform value: ${p}`);
              console.error('Valid values: agents, claude, or agents,claude');
              process.exit(1);
            }
          }

          flags.platforms = validPlatforms;
        }
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
 * Check if required flags are present for non-interactive mode
 */
export function hasRequiredFlags(flags: Flags): boolean {
  return flags.noInteractive === true;
}

/**
 * Validate flags and convert to InstallChoices
 * Returns null if validation fails
 */
export function validateFlags(flags: Flags): InstallChoices | null {
  // Custom tier not supported in non-interactive mode
  const tier = flags.tier || 'recommended';
  if (tier !== 'required' && tier !== 'recommended' && tier !== 'full') {
    console.error('Error: Custom tier selection requires interactive mode.');
    console.error('Run without --no-interactive flag for custom tier selection.');
    return null;
  }

  const scope: ScopeChoice = flags.scope || 'project';
  const platforms: Platform[] = flags.platforms || ['agents'];

  return {
    protocolTier: tier as ProtocolTier,
    customProtocols: [],
    seed: 'none',
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
  --platform <agents|claude>            Platform(s) (default: agents)
                                        Use comma-separated for multiple: agents,claude
  --no-interactive                      Skip prompts, use flags + defaults
  --help, -h                            Show this help

EXAMPLES:
  # Interactive installation (recommended)
  npx @extragraj/stackshift-skills init

  # Non-interactive with defaults
  npx @extragraj/stackshift-skills init --no-interactive

  # Non-interactive with specific options
  npx @extragraj/stackshift-skills init --tier full --scope project --platform agents --no-interactive

  # Install to both platforms
  npx @extragraj/stackshift-skills init --platform agents,claude --no-interactive

  # Fix multi-tier installation
  npx @extragraj/stackshift-skills repair

NOTES:
  - stackshift-core is always installed (required for workflow)
  - Custom tier selection requires interactive mode
  - Protocol tiers are cumulative (full includes recommended + required)
  `);
}
