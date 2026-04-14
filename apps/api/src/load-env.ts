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

// Load monorepo and package env files as fallbacks only.
// Real process environment variables from Render/Vercel must remain authoritative.
loadIfExists(path.join(repoRoot, '.env.local'), false);
loadIfExists(path.join(repoRoot, '.env'), false);
loadIfExists(path.join(apiRoot, '.env.local'), false);
loadIfExists(path.join(apiRoot, '.env'), false);
