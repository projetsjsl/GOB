import fs from 'node:fs';
import path from 'node:path';
import { parseSync } from '@babel/core';

const rootDir = path.join(process.cwd(), 'public', 'js', 'dashboard', 'components');

const collectJsFiles = (dir, list = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, list);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.js')) {
      list.push(fullPath);
    }
  }
  return list;
};

const files = fs.existsSync(rootDir) ? collectJsFiles(rootDir) : [];
const failures = [];

for (const filePath of files) {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    parseSync(code, {
      filename: filePath,
      babelrc: false,
      configFile: false,
      sourceType: 'unambiguous',
      presets: [
        ['@babel/preset-react', { runtime: 'classic' }]
      ]
    });
  } catch (error) {
    failures.push({ filePath, message: error.message });
  }
}

if (failures.length > 0) {
  console.error('Dashboard JSX syntax check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.filePath}: ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Dashboard JSX syntax check passed (${files.length} files).`);
