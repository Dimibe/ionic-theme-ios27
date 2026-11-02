import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { basename, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Exercise an unpublished plugin in an isolated copy of the real theme demo.
// Preserve the caller's manifests, lockfiles, installed packages and native project.
const archive = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(archive)) throw new Error('Usage: npm run test:native-candidate -- /absolute/path/plugin.tgz [--e2e] [--shard=INDEX/TOTAL] [--simulator=UDID]');
const shard = process.argv.find(arg => arg.startsWith('--shard='));
if (shard) {
  const match = /^--shard=([1-9]\d*)\/([1-9]\d*)$/.exec(shard);
  if (!process.argv.includes('--e2e') || !match || Number(match[1]) > Number(match[2])) {
    throw new Error('--shard requires --e2e and an INDEX/TOTAL with 1 <= INDEX <= TOTAL');
  }
}
const manifest = JSON.parse(execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }));
if (manifest.name !== '@rdlabo/capacitor-native-ui') throw new Error('Expected a capacitor-native-ui package archive');
const source = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'theme-native-candidate-'));
const excluded = new Set(['.git', 'node_modules', 'dist', 'www', '.angular', '.build', '.swiftpm', 'test-results', 'playwright-report', 'blob-report']);
cpSync(source, directory, { recursive: true, filter: path => !excluded.has(basename(path)) });
console.log(`Candidate ${manifest.version}; isolated demo and diagnostics: ${directory}`);
const spec = `file:${archive}`;
for (const [path, section] of [['package.json', 'devDependencies'], ['demo/package.json', 'dependencies']]) {
  const file = join(directory, path);
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg[section]['@rdlabo/capacitor-native-ui'] = spec;
  if (path === 'package.json') pkg.peerDependencies['@rdlabo/capacitor-native-ui'] = manifest.version;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
}
// Refresh the copied theme's peer metadata, including prerelease candidates.
const demoLockPath = join(directory, 'demo/package-lock.json');
const demoLock = JSON.parse(readFileSync(demoLockPath, 'utf8'));
delete demoLock.packages['node_modules/@rdlabo/ionic-theme-ios27'];
writeFileSync(demoLockPath, JSON.stringify(demoLock, null, 2) + '\n');
const run = (cwd, command, args) => execFileSync(command, args, { cwd: join(directory, cwd), stdio: 'inherit' });
run('.', 'npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
run('.', 'npm', ['run', 'build']);
run('.', 'npm', ['run', 'test:packages']);
run('demo', 'npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
// Ensure the theme and the demo actually consume the supplied archive, including betas.
for (const cwd of ['.', 'demo']) {
  const installed = JSON.parse(readFileSync(join(directory, cwd, 'node_modules/@rdlabo/capacitor-native-ui/package.json'), 'utf8'));
  assert.deepEqual(installed, manifest, `${cwd} must install the supplied candidate archive`);
  const coreEntry = manifest.exports['./core'].import.replace(/^\.\//, '');
  const expectedCore = execFileSync('tar', ['-xOf', archive, `package/${coreEntry}`]);
  assert.deepEqual(readFileSync(join(directory, cwd, 'node_modules/@rdlabo/capacitor-native-ui', coreEntry)), expectedCore, `${cwd} must use the candidate build`);
}
// The theme's transition adapter and application must resolve one plugin instance.
const applicationRequire = createRequire(join(directory, 'demo/package.json'));
const themeRequire = createRequire(join(directory, 'demo/node_modules/@rdlabo/ionic-theme-ios27/package.json'));
assert.equal(themeRequire.resolve('@rdlabo/capacitor-native-ui/package.json'), applicationRequire.resolve('@rdlabo/capacitor-native-ui/package.json'), 'Theme and application must share the candidate plugin');
run('demo', 'npm', ['test', '--', '--watch=false']);
run('demo', 'npm', ['run', 'build', '--', '--configuration=production']);
if (process.argv.includes('--e2e')) {
  // Never reuse a running demo that may have a different plugin installed.
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  execFileSync('npm', ['run', 'test:e2e', ...(shard ? ['--', shard] : [])], { cwd: join(directory, 'demo'), stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_PORT: String(port) } });
}
const simulator = process.argv.find(arg => arg.startsWith('--simulator='))?.split('=')[1];
if (simulator) {
  run('.', 'sh', ['scripts/verify-native-ui.sh', simulator]);
  run('.', 'sh', ['scripts/verify-native-search.sh', simulator, 'search']);
  run('.', 'sh', ['scripts/verify-native-search.sh', simulator, 'edge']);
}
