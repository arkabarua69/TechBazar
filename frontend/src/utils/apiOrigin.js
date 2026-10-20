/**
 * OAuth popup base URL.
 *
 * The social-login popup is a real top-level navigation, and the CRA dev
 * server's SPA fallback answers *any* HTML navigation under /api with
 * index.html — so a popup to "/api/v1/auth/google/start" on :3000 would render
 * the React 404 page instead of reaching Express.
 *
 * Production serves the API and the app from the same origin, so a relative
 * URL works there. In development the API lives on :4000, so we target it
 * directly. Override with REACT_APP_API_ORIGIN if your setup differs.
 */
export const API_ORIGIN =
    process.env.REACT_APP_API_ORIGIN ||
    (process.env.NODE_ENV === 'development'
        ? `${window.location.protocol}//${window.location.hostname}:4000`
        : '');
