import * as fs from 'node:fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

function loadIfExists(filePath: string, override: boolean) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  dotenv.config({ path: filePath, override });
}

const apiRoot = process.cwd();
const repoRoot = path.resolve(apiRoot, '..', '..');

// Load monorepo root env first, then allow apps/api env files to override it.
loadIfExists(path.join(repoRoot, '.env.local'), false);
loadIfExists(path.join(repoRoot, '.env'), false);
loadIfExists(path.join(apiRoot, '.env.local'), true);
loadIfExists(path.join(apiRoot, '.env'), true);
