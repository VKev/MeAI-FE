import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

function resolveServerEntry() {
  const defaultEntry = 'build/server/index.js';
  if (existsSync(defaultEntry)) {
    return defaultEntry;
  }

  const serverRoot = 'build/server';
  if (!existsSync(serverRoot)) {
    throw new Error('Could not find build/server. Run "npm run build" first.');
  }

  for (const dir of readdirSync(serverRoot)) {
    const candidate = join(serverRoot, dir, 'index.js');
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not find a server entrypoint in build/server.');
}

const entry = resolveServerEntry();
const require = createRequire(import.meta.url);
const servePackageJsonPath = require.resolve('@react-router/serve/package.json');
const cliPath = join(dirname(servePackageJsonPath), 'bin.js');
const child = spawn(process.execPath, [cliPath, entry], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
