/**
 * components/ErrorBoundary/ErrorBoundary.jsx
 * -----------------------------------------------------------------------------
 * Safety net around every page (used in App.js).
 *
 * If a page throws while rendering, React would normally unmount the whole app
 * and leave a blank screen. This boundary catches the error and shows a short
 * message with "Try again" and "Go to the home page" instead; the navbar and
 * footer stay usable.
 *
 * It also recognises a failed download of a page's code (common right after a
 * new version is deployed, when the browser still has the old file names) and
 * offers to reload the site, which fetches the new version.
 *
 * Error boundaries must be class components; React has no hook for this yet.
 * Error details are only logged in development, so nothing internal is shown to
 * visitors in production.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import styles from './ErrorBoundary.module.css';

// "Loading chunk 12 failed" / "Failed to fetch dynamically imported module"
const isChunkError = (error) => /chunk|dynamically imported module/i.test(String(error?.message || error?.name || ''));

// When we reload because of a chunk error, remember when. If the same error comes back
// straight after that reload, reloading again won't help (e.g. the files are being
// requested from the wrong address), so we stop offering it instead of looping.
const RELOAD_KEY = 'virsaa:chunk-reload';
const RELOAD_WINDOW_MS = 30000;
const reloadedRecently = () => {
  try { return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) || 0) < RELOAD_WINDOW_MS; } catch { return false; }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  // Switch to the fallback screen on the next render
  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Page crashed:', error, info?.componentStack);
    }
  }

  // Render the page again (useful for one-off failures)
  handleRetry = () => {
    if (isChunkError(this.state.error) && !reloadedRecently()) {
      try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* storage blocked */ }
      window.location.reload(); // fetch the newly deployed files
      return;
    }
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // A chunk error right after our own reload isn't an update; treat it as a normal failure
    const outdated = isChunkError(error) && !reloadedRecently();
    return (
      <main className={styles.wrap}>
        <section className={styles.card} role="alert">
          <h1 className={styles.title}>{outdated ? 'Virsaa has been updated' : 'This page didn’t load'}</h1>
          <p className={styles.text}>
            {outdated
              ? 'Reload to get the newest version of the site.'
              : 'Something on this page stopped working. Try again, or go back to the home page.'}
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={this.handleRetry}>
              {outdated ? 'Reload' : 'Try again'}
            </button>
            {/* A plain link (not <Link>) so it still works if the router itself failed */}
            <a href="/" className={styles.secondary}>Go to the home page</a>
          </div>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
