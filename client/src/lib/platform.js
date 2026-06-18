// True when running inside the native Android wrapper. Capacitor injects
// window.Capacitor into the wrapper's webview even though it loads the live
// app.sherlock.school URL, so we can detect it web-side — no .aab rebuild.
//
// Used to hide ALL payment/subscription UI inside the app for Google Play
// Billing compliance. Computed once at module load (Capacitor is injected
// before the app bundle runs) and imported app-wide. In a normal browser this
// is false and behavior is unchanged.
export const isNativeApp = window.Capacitor?.isNativePlatform?.() === true;
