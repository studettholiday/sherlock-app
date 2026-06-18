import { isNativeApp } from './platform';

// Wire the Android hardware back button (and edge swipe-back) to navigate
// through the app's history instead of closing the app. The app routes by
// window.location.pathname with real full-page navigations, so history.back()
// moves between pages (chat, pending, legal, etc.). We exit only when there's
// nothing left to go back to — i.e. the sign-in root.
//
// Uses the runtime-injected Capacitor App plugin (window.Capacitor.Plugins.App)
// so we don't need the @capacitor/app npm package in the web bundle. No-op in a
// normal browser, or in the app if the App plugin isn't present in the wrapper
// build (in which case the back button keeps its current behavior).
export function setupNativeBackButton() {
  if (!isNativeApp) return;
  const App = window.Capacitor?.Plugins?.App;
  if (!App?.addListener) return;
  App.addListener('backButton', ({ canGoBack } = {}) => {
    if (canGoBack || window.history.length > 1) {
      window.history.back();
    } else if (App.exitApp) {
      App.exitApp();
    }
  });
}
