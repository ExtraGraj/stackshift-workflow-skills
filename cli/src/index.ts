import { install } from './install.js';

const [, , command] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'init':
    case undefined:
      await install();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: stackshift init');
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
