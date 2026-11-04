import assert from 'node:assert/strict';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, existsSync, mkdirSync, symlinkSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Validate the theme archive consumers install, not the local package link.
const dir = mkdtempSync(join(tmpdir(), 'ionic-theme-packages-'));
const sourceFiles = ['package.json', 'package-lock.json', 'demo/package-lock.json'];
const originals = sourceFiles.map((file) => readFileSync(file, 'utf8'));
try {
  const packed = Object.values(JSON.parse(
    execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', dir], { encoding: 'utf8' }),
  ));
  assert.equal(packed.length, 1);
  sourceFiles.forEach((file, index) => assert.equal(readFileSync(file, 'utf8'), originals[index], `${file} changed while packing`));
  const nativeName = '@rdlabo/capacitor-native-ui';
  const [archive] = packed;
  const manifest = JSON.parse(execFileSync('tar', ['-xOf', join(dir, archive.filename), 'package/package.json'], { encoding: 'utf8' }));
  const extracted = join(dir, archive.filename + '-extracted');
  mkdirSync(extracted);
  execFileSync('tar', ['-xzf', join(dir, archive.filename), '-C', extracted]);
  const packageRoot = join(extracted, 'package');
  const dependencyPath = join(dir, 'node_modules', manifest.name);
  mkdirSync(join(dependencyPath, '..'), { recursive: true });
  symlinkSync(packageRoot, dependencyPath, 'dir');
  symlinkSync(join(dir, 'node_modules'), join(packageRoot, 'node_modules'), 'dir');
  const files = new Set(archive.files.map((file) => file.path));

  // Locally installed dependencies must not hide undeclared runtime imports.
  const dependencies = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})]);
  for (const file of files) {
    if (!file.startsWith('dist/') || !file.endsWith('.js')) continue;
    const source = ts.createSourceFile(
      file,
      readFileSync(join(packageRoot, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    const visit = (node) => {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
            ? node.arguments[0]
            : undefined;
      if (specifier && ts.isStringLiteral(specifier) && !specifier.text.startsWith('.')) {
        const name = specifier.text
          .split('/')
          .slice(0, specifier.text.startsWith('@') ? 2 : 1)
          .join('/');
        assert(dependencies.has(name), `${manifest.name}: undeclared dependency ${name} in ${file}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  for (const entry of Object.values(manifest.exports)) {
    for (const target of typeof entry === 'string' ? [entry] : Object.values(entry)) {
      if (!target.includes('*')) assert(files.has(target.replace(/^\.\//, '')), `${manifest.name}: missing ${target}`);
    }
  }
  assert(files.has('README.md'));
  assert(files.has('LICENSE'));
  assert.equal(manifest.name, '@rdlabo/ionic-theme-ios27');
  assert.equal(manifest.capacitor, undefined, 'Only the native package registers a Capacitor plugin');
  assert(!files.has('Package.swift'));
  for (const entry of ['native', 'vertical-bars']) {
    assert.equal(manifest.exports['./' + entry], undefined, 'Removed theme entry must not be exported');
    assert(![...files].some((file) => file.startsWith('src/' + entry) || file.startsWith('dist/' + entry)));
  }
  assert(![...files].some((file) => file.startsWith('ios/')));
  execFileSync('tar', ['-xzf', join(dir, archive.filename), '-C', dir]);
  execFileSync('node_modules/.bin/sass', [
    join(dir, 'package/src/styles/ionic-theme-ios27.scss'),
    join(dir, 'consumer.css'),
    '--no-source-map',
  ]);
  assert(existsSync(join(dir, 'consumer.css')));
  assert(manifest.peerDependencies[nativeName], 'Theme must share the application plugin through a required peer');
  assert.equal(manifest.dependencies[nativeName], undefined, 'Theme must not install a private plugin copy');
  // Plugin internals and its archive are verified in the plugin repository.
  // Copy runtime peers so the packed theme resolves in an isolated consumer.
  for (const name of [nativeName, '@webview-native-ui/engine']) {
    cpSync(resolve('node_modules', name), join(dir, 'node_modules', name), { recursive: true });
  }
  const consumer = join(dir, 'consumer.ts');
  // Runtime dependencies come from this checkout; the theme resolves from its archive.
  for (const name of ['@ionic', '@stencil', '@rdlabo/ionic-theme-utils', 'ionicons', 'typescript']) {
    symlinkSync(resolve('node_modules', name), join(dir, 'node_modules', name), 'dir');
  }
  if (process.argv.includes('--esm')) {
    execFileSync(
      process.execPath,
      [resolve('node_modules/@rdlabo/ionic-theme-utils/scripts/check-esm.mjs'), packageRoot],
      { stdio: 'inherit' },
    );
  }

  // Theme-only consumers use the integration peer without installing Capacitor.
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { iosTransitionAnimation, withNativeUITransition, setVerticalBarsLayout, applyFoldStateClasses } from '@rdlabo/ionic-theme-ios27';
    assert.equal(typeof iosTransitionAnimation, 'function');
    assert.equal(typeof setVerticalBarsLayout, 'function');
    assert.equal(typeof applyFoldStateClasses, 'function');
    setVerticalBarsLayout({ edge: null });
    const animation = { play() {} };
    assert.equal(withNativeUITransition(() => animation)({}), animation);
    await assert.rejects(import('@capacitor/core'), { code: 'ERR_MODULE_NOT_FOUND' });
    for (const entry of ['native', 'vertical-bars']) {
      await assert.rejects(import('@rdlabo/ionic-theme-ios27/' + entry), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
    }
  `], { cwd: dir, stdio: 'inherit' });
  writeFileSync(consumer, `
    import { iosTransitionAnimation, withNativeUITransition, setVerticalBarsLayout, applyFoldStateClasses } from '@rdlabo/ionic-theme-ios27';
    import type { VerticalBarsLayout } from '@rdlabo/ionic-theme-ios27';
    function existingLayoutConsumer(layout: VerticalBarsLayout) {
      const edge: 'leading' | 'trailing' | null = layout.edge;
      return edge;
    }
    setVerticalBarsLayout({ edge: undefined, toolbarTop: 174 });
    withNativeUITransition(iosTransitionAnimation);
  `);
  execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--exactOptionalPropertyTypes', '--skipLibCheck', '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2022', '--lib', 'es2022,dom', consumer], { cwd: dir, stdio: 'inherit' });
  console.log('Theme archive, public exports, shared plugin peer, standalone Sass and Capacitor-free consumption verified.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
