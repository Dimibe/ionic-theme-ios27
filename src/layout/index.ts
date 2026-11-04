/** Web layout inputs. Device capabilities belong to the application or native plugin. */
export interface VerticalBarsLayout {
  edge: 'leading' | 'trailing' | null;
  inset?: number;
  /** Physical toolbar origin in viewport CSS pixels. Omit to preserve CSS overrides or use the 174px theme default. */
  toolbarTop?: number;
}

const toolbarTopProperty = '--ios-theme-vertical-bars-toolbar-top';
const toolbarTops = new WeakMap<HTMLElement, { previous: string; priority: string; applied: string }>();

/** Applies only Web layout. Does not enable Native UI or report native availability. */
export const setVerticalBarsLayout = (
  layout: { [K in keyof VerticalBarsLayout]?: VerticalBarsLayout[K] | undefined },
  root?: HTMLElement,
  rtl?: boolean,
): void => {
  const app = root ?? (typeof document === 'undefined' ? undefined : document.querySelector<HTMLElement>('ion-app'));
  if (!app) return;
  const { edge = null, inset = 0 } = layout;
  const direction = rtl ?? app.closest('[dir]')?.getAttribute('dir') === 'rtl';
  app.classList.toggle('ios-theme-vertical-bars', edge !== null);
  app.classList.toggle('ios-theme-vertical-bars-left', edge !== null && (edge === 'leading') !== direction);
  if (edge && Number.isFinite(inset) && inset > 0) app.style.setProperty('--ios-theme-vertical-bars-native-inset', `${inset}px`);
  else app.style.removeProperty('--ios-theme-vertical-bars-native-inset');
  // Restore only while the value still matches our write; identical application writes are indistinguishable.
  const saved = toolbarTops.get(app);
  if (saved) {
    if (app.style.getPropertyValue(toolbarTopProperty) === saved.applied && !app.style.getPropertyPriority(toolbarTopProperty)) {
      if (saved.previous) app.style.setProperty(toolbarTopProperty, saved.previous, saved.priority);
      else app.style.removeProperty(toolbarTopProperty);
    }
    toolbarTops.delete(app);
  }
  if (edge) {
    // Preserve existing CSS/inline customization when the caller omits the top.
    const configured =
      layout.toolbarTop === undefined
        ? app.ownerDocument.defaultView?.getComputedStyle(app).getPropertyValue(toolbarTopProperty).trim() ||
          app.style.getPropertyValue(toolbarTopProperty).trim()
        : undefined;
    const top = layout.toolbarTop ?? (configured ? undefined : 174);
    if (top !== undefined && Number.isFinite(top) && top >= 0) {
      const previous = app.style.getPropertyValue(toolbarTopProperty);
      const priority = app.style.getPropertyPriority(toolbarTopProperty);
      const applied = `${top}px`;
      app.style.setProperty(toolbarTopProperty, applied);
      toolbarTops.set(app, { previous, priority, applied });
    }
  }
  app.ownerDocument.defaultView?.dispatchEvent(new Event('nativeUIRefresh'));
};

export interface FoldState {
  state: 'flat' | 'half-opened' | 'closed';
  hingeBounds?: { x: number; y: number; width: number; height: number };
}

/** Maps application-supplied posture to theme CSS, without subscribing to a device plugin. */
export function applyFoldStateClasses(root: HTMLElement, fold: FoldState): void {
  for (const state of ['flat', 'half-opened', 'closed']) root.classList.toggle(`ios-theme-fold-${state}`, fold.state === state);
  root.classList.toggle('ios-theme-fold-expanded', fold.state === 'half-opened' || (fold.state === 'flat' && !!fold.hingeBounds));
}
