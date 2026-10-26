# Ionic Theme iOS27

Install with `npm install @rdlabo/ionic-theme-ios27 @erkamyaman/capacitor-foldable`. For 1.x, use the [v1.2.1 guide](https://github.com/rdlabo-dev/ionic-theme-ios27/tree/ios27-v1.2.1).
A theme for Ionic apps that brings iOS 27 Liquid Glass and motion to the Web. Capacitor iOS apps can also opt into Native UI for supported controls, officially supported starting with 2.0.0.

**[Ionic 9 demo](https://ionic-theme-ios27.rdlabo.dev/) · [Setup guide](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/setup)**

<!-- rdlabo-docs-pick -->

<p>
  <img src="https://raw.githubusercontent.com/rdlabo-dev/ionic-theme-ios27/main/screenshots/ios27-settings.png" width="32%" alt="iOS 27 theme: Settings in light mode with a Liquid Glass search bar" />
  <img src="https://raw.githubusercontent.com/rdlabo-dev/ionic-theme-ios27/main/screenshots/ios27-settings-dark.png" width="32%" alt="iOS 27 theme: Settings in dark mode" />
  <img src="https://raw.githubusercontent.com/rdlabo-dev/ionic-theme-ios27/main/screenshots/ios27-library.png" width="32%" alt="iOS 27 theme: Library with Liquid Glass buttons and tab bar" />
</p>

<!-- /rdlabo-docs-pick -->

## What would you like to do?

| Goal                                                  | Guide                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Style an existing Ionic app                           | [Get started](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/setup)                                |
| Select iOS 26/27 styles and optionally use MD3        | [Adaptive themes](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/adaptive-themes)                  |
| Add native iOS controls after setting up the theme    | [Add Native UI](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/add-native-ui)                      |
| Add a side rail to Ionic while keeping your own theme | [Vertical Bars step by step](https://docs.rdlabo.dev/projects/capacitor-native-ui/docs/ionic-vertical-bars) |
| Upgrade an existing installation                      | [Migration](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/migration)                              |

## Get started

We use [Capacitor Foldable](https://github.com/erkamyaman/capacitor-foldable), an excellent community plugin by Erkam Yaman, as our standard device-layout integration. It exposes fold state, hinge geometry, bar placement and change events to your application, giving you control over how the layout responds. Foldable handles device reporting; the theme provides Web layout helpers and Native UI projects controls. Install it alongside the package you use, then connect its events in your app.

Use the [four-step setup guide](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/setup) to install the theme, load styles, configure animations, and preview your first screen. Its declared Ionic compatibility range is `>=8.8.1 <10`, including Angular, React, and Vue; automated E2E validation targets Ionic 9. A native Capacitor project is not required for browser use.

The theme styles toolbars, tabs, lists, buttons, search, and overlays, with light and dark appearances. It does not activate native controls. Once the Web theme is working, you can optionally [add Native UI](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/add-native-ui).

## Customize your app

- [Features](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/features): CSS variables, Liquid Glass, and selective component imports.
- [Special markup and classes](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/special-markup): opt-in component behavior.
- [Using ion-item-group](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/using-ion-item-group): inset list markup.
- [Animation](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/animation): tab, segment, and search effects.
- [ESLint](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/eslint): catch unsupported list structure.
- [Vertical Bars layout](https://docs.rdlabo.dev/projects/ionic-theme-ios27/docs/vertical-bars-layout): spacing, RTL, device placement, posture, and split panes.
