import { expect, test } from 'vitest';
import { setVerticalBarsLayout, applyFoldStateClasses } from '../node_modules/@rdlabo/ionic-theme-ios27/src/layout';

test('theme layout resolves logical edges and clears only its own classes and inset', () => {
  const root = document.createElement('div');
  root.className = 'app-custom';
  root.dir = 'rtl';
  root.style.setProperty('--app-space', '8px');
  setVerticalBarsLayout({ edge: 'trailing', inset: 72 }, root);
  expect(root.classList.contains('ios-theme-vertical-bars-left')).toBe(true);
  expect(root.style.getPropertyValue('--ios-theme-vertical-bars-native-inset')).toBe('72px');
  setVerticalBarsLayout({ edge: 'leading', inset: NaN }, root);
  expect(root.classList.contains('ios-theme-vertical-bars-left')).toBe(false);
  expect(root.style.getPropertyValue('--ios-theme-vertical-bars-native-inset')).toBe('');
  setVerticalBarsLayout({ edge: null }, root);
  expect(root.className).toBe('app-custom');
  expect(root.style.getPropertyValue('--app-space')).toBe('8px');
});

test('toolbar geometry switches and restores the previous inline value', () => {
  const root = document.createElement('div');
  const top = '--ios-theme-vertical-bars-toolbar-top';
  root.style.setProperty(top, '210px');
  setVerticalBarsLayout({ edge: 'trailing', toolbarTop: 174 }, root);
  expect(root.style.getPropertyValue(top)).toBe('174px');
  setVerticalBarsLayout({ edge: 'trailing', toolbarTop: 124 }, root);
  expect(root.style.getPropertyValue(top)).toBe('124px');
  setVerticalBarsLayout({ edge: null }, root);
  expect(root.style.getPropertyValue(top)).toBe('210px');
});

test('clearing toolbar geometry preserves a later application override', () => {
  const root = document.createElement('div');
  const top = '--ios-theme-vertical-bars-toolbar-top';
  setVerticalBarsLayout({ edge: 'trailing', toolbarTop: 174 }, root);
  setVerticalBarsLayout({ edge: 'trailing', toolbarTop: 124 }, root);
  root.style.setProperty(top, '250px');
  setVerticalBarsLayout({ edge: null }, root);
  expect(root.style.getPropertyValue(top)).toBe('250px');
});

test('identical layout input applies once and does not re-dispatch refresh', () => {
  const root = document.createElement('div');
  let refreshes = 0;
  root.ownerDocument.defaultView?.addEventListener('nativeUIRefresh', () => refreshes++);
  const layout = { edge: 'trailing' as const, inset: 84, toolbarTop: 174 };
  setVerticalBarsLayout(layout, root);
  setVerticalBarsLayout(layout, root);
  setVerticalBarsLayout({ ...layout }, root);
  expect(refreshes).toBe(1);
  setVerticalBarsLayout({ ...layout, toolbarTop: 124 }, root);
  expect(refreshes).toBe(2);
  setVerticalBarsLayout({ edge: null }, root);
  expect(refreshes).toBe(3);
});

test('theme posture helper preserves unrelated layout state', () => {
  const root = document.createElement('div');
  root.className = 'app-custom';
  applyFoldStateClasses(root, { state: 'half-opened' });
  expect(root.classList.contains('ios-theme-fold-expanded')).toBe(true);
  applyFoldStateClasses(root, { state: 'closed' });
  expect(root.classList.contains('ios-theme-fold-expanded')).toBe(false);
  expect(root.classList.contains('ios-theme-fold-half-opened')).toBe(false);
  expect(root.classList.contains('app-custom')).toBe(true);
});
