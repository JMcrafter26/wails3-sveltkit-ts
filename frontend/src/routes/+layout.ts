// The Wails webview is a client-only environment. Disabling SSR keeps
// browser-only Wails runtime imports out of any server-side build step.
export const ssr = false;

// SvelteKit's adapter-static fallback provides the single-page app shell.
export const prerender = false;

// Wails serves the fallback shell for extensionless paths. Keeping URLs
// canonical without a trailing slash avoids directory-style asset lookups.
export const trailingSlash = 'never';
