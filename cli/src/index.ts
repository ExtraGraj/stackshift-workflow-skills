import { install } from './install.js';
import { repair } from './repair.js';
import { showHelp } from './flags.js';

const [, , command] = process.argv;

async function main(): Promise<void> {
  // Handle --help flag at root level
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  switch (command) {
    case 'init':
    case undefined:
      await install();
      break;
    case 'repair':
      await repair();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('');
      showHelp();
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
