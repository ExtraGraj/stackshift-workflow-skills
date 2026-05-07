import { readFileSync, writeFileSync } from 'fs';

const skillVersion = readFileSync('./skill.version', 'utf8').trim();
const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;

if (!semverRegex.test(skillVersion)) {
  console.error(`❌ Invalid version in skill.version: ${skillVersion}`);
  process.exit(1);
}

// Update root package.json
const rootPkg = JSON.parse(readFileSync('./package.json', 'utf8'));
rootPkg.version = skillVersion;
writeFileSync('./package.json', JSON.stringify(rootPkg, null, 2) + '\n');
console.log(`✓ Updated package.json to ${skillVersion}`);

// Update cli/package.json
const cliPkg = JSON.parse(readFileSync('./cli/package.json', 'utf8'));
cliPkg.version = skillVersion;
writeFileSync('./cli/package.json', JSON.stringify(cliPkg, null, 2) + '\n');
console.log(`✓ Updated cli/package.json to ${skillVersion}`);

// Update README.md (line 3: "> **Version** 0.1.0")
let readme = readFileSync('./README.md', 'utf8');
readme = readme.replace(
  /^> \*\*Version\*\* \d+\.\d+\.\d+(-[\w.]+)?/m,
  `> **Version** ${skillVersion}`
);
writeFileSync('./README.md', readme);
console.log(`✓ Updated README.md to ${skillVersion}`);

console.log(`\n✓ All versions synced to ${skillVersion}`);