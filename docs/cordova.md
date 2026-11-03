# Optional: use the iOS 27 theme with Cordova

Use `@webview-native-ui/cordova-plugin` for a Cordova app with Ionic and Native UI. The plugin includes the theme JavaScript, types and CSS, already connected to its native integration. You do not need bundler aliases or a separate installation of `@rdlabo/ionic-theme-ios27` or `@rdlabo/capacitor-native-ui`.

Capacitor is the default native host in these docs. This optional guide covers the package and startup differences for a bundled Ionic application using Cordova. Shared markup, styling and helper usage remain in the existing feature guides.

## 1. Install the Cordova plugin

From the Cordova application root:

```sh
cordova plugin add @webview-native-ui/cordova-plugin@0.1.1
```

This installs the prepared native and JavaScript assets and saves the npm dependency. If your Web bundler is a separate npm project, install the same version in that project too:

```sh
npm install @webview-native-ui/cordova-plugin@0.1.1
```

If Cordova and your bundler share a `package.json`, no second install is needed. Keep your existing Ionic dependencies. See the plugin's [requirements](https://github.com/webview-native-ui/cordova-plugin#requirements) for Cordova, SwiftPM, Xcode and Android configuration. Native rendering requires supported iOS versions; standard Android controls retain Web presentation.

`@erkamyaman/capacitor-foldable` is a Capacitor plugin and is not required by this Cordova setup. The Capacitor-specific device-layout wiring in other theme guides does not establish Cordova support for those APIs.

## 2. Load the bundled theme styles

Keep Ionic's base styles, then add these to your global stylesheet. Replace an existing dark palette instead of loading multiple palettes:

```css
@import '@ionic/core/css/palettes/dark.system.css';
@import '@webview-native-ui/cordova-plugin/theme/css/default-variables.css';
@import '@webview-native-ui/cordova-plugin/theme/css/ionic-theme-ios27.css';
@import '@webview-native-ui/cordova-plugin/theme/css/md-remove-ios-class-effect.css';
@import '@webview-native-ui/cordova-plugin/theme/css/ionic-theme-ios27-dark-system.css';
```

For manual dark mode, use `dark.class.css` and `ionic-theme-ios27-dark-class.css` instead, and toggle `ion-palette-dark` on `html`. Keep the Ionic and theme variants paired.

## 3. Configure Ionic animations

Import the animations from the Cordova package and pass them to your existing Ionic initialization before rendering the app:

```ts
import { iosTransitionAnimation, popoverEnterAnimation, popoverLeaveAnimation } from '@webview-native-ui/cordova-plugin/theme';

const ionicConfig = {
  mode: 'ios' as const,
  navAnimation: iosTransitionAnimation,
  popoverEnter: popoverEnterAnimation,
  popoverLeave: popoverLeaveAnimation,
};
```

Use your framework's existing initializer as described in [Configure Ionic animations](setup.md#3-configure-ionic-animations); do not initialize Ionic twice. To retain Material Design mode on Android, apply these options only to your iOS configuration. Other helpers such as `attachTabBarSearchable` are also available from `/theme`; importing them does not automatically attach their behavior.

## 4. Start Native UI after Cordova and the app are ready

Keep `<script src="cordova.js"></script>` in your Cordova entry HTML. Register the device-ready listener during startup, and wait for your framework to mount `ion-app` before enabling Native UI:

```ts
import { enableNativeUI } from '@webview-native-ui/cordova-plugin';

const deviceReady = new Promise<void>((resolve) => {
  document.addEventListener('deviceready', () => resolve(), { once: true });
});

export async function startNativeUI(appMounted: Promise<void>) {
  await Promise.all([deviceReady, appMounted]);
  return enableNativeUI();
}
```

Supply `appMounted` from your application's mount lifecycle, call `startNativeUI()` once and retain the returned handle. Call `await handle.destroy()` when the application permanently stops using Native UI. Do not create a new runtime for each page or also call `window.NativeUI.enableNativeUI()` alongside this npm-based startup. Browser previews do not emit Cordova's `deviceready`; keep this startup path for the Cordova build and preview the Web theme through your normal browser entry.

Build your Web assets into the Cordova application's `www` directory, then prepare and rebuild the native app, for example:

```sh
cordova prepare ios
cordova build ios
```

Use `android` for an Android build after completing its requirements. Do not use `npx cap sync` for Cordova. On iOS the adapter disables automatic scroll-view insets; apply safe-area spacing in your page CSS as described in the [plugin guide](https://github.com/webview-native-ui/cordova-plugin#start-native-ui).

## Use the shared theme guides

Continue with [markup and classes](special-markup.md), [inset lists](using-ion-item-group.md), [CSS variables and component styles](features.md), and [animation helpers](animation.md). Their examples use the standalone theme package by default. Apply these substitutions for the theme version bundled with your Cordova plugin:

| Standard documentation                                     | Cordova equivalent                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| JavaScript imports from `@rdlabo/ionic-theme-ios27`        | `@webview-native-ui/cordova-plugin/theme`                                      |
| CSS imports from `@rdlabo/ionic-theme-ios27/dist/css/*`    | `@webview-native-ui/cordova-plugin/theme/css/*` (include the `.css` extension) |
| Native UI startup from `@rdlabo/capacitor-native-ui`       | Cordova package root, with the startup lifecycle above                         |
| Sass imports from `@rdlabo/ionic-theme-ios27/src/styles/*` | Not included in the Cordova package; use the compiled CSS and CSS variables    |

The [adaptive themes](adaptive-themes.md) guide uses standalone theme Sass sources and is not a drop-in Cordova recipe. The CSS layout concepts in [Vertical Bars layout](vertical-bars-layout.md) are shared, but its Capacitor Foldable wiring requires host-specific integration. Follow the Cordova plugin's support scope rather than copying Capacitor native setup commands.

## Moving an existing theme app to this integration

Replace all theme JavaScript imports from `@rdlabo/ionic-theme-ios27` with `@webview-native-ui/cordova-plugin/theme`, and CSS imports from `@rdlabo/ionic-theme-ios27/dist/css/*` with `@webview-native-ui/cordova-plugin/theme/css/*`. Import Native UI startup from the Cordova package root. Remove old integration aliases and original theme/Capacitor dependencies once they are no longer used by the app. Keep your component markup, bindings and handlers.

Use helpers and CSS from the same bundled theme version. Cordova 0.1.1 includes theme 2.1.0; installing a newer standalone theme does not update that copy. Check `shared/ORIGIN.json` in the installed Cordova package for its theme version and Core revision, and update the Cordova package to receive newer bundled sources.

## Supported behavior and verification

Capacitor remains the primary supported host. Cordova comparisons covered Ionic 8.8.19 on iOS 27.2 and Android API 35: controls, tabs, overlays, theme integration, dark mode and stop/restart. Search used the theme's Web fallback on both hosts. These checks do not establish native-search parity, full framework-router transitions or interactive back gestures. The Ionic 9 Capacitor demo in this repository is not a Cordova acceptance test.

If theme helpers do not coordinate with native controls, check that all theme imports use `/theme`, only one Native UI runtime is started, and your Web bundle and native plugin use the same version. For bridge, installation or bundled integration issues, report them in [cordova-plugin](https://github.com/webview-native-ui/cordova-plugin/issues); shared theme styling or animation fixes belong in this repository.
