/**
 * Optional Sentry-compatible instrumentation.
 * Activates only when SENTRY_DSN is set and @sentry/nextjs is installed.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.SENTRY_DSN) return;

  try {
    // Dynamic path avoids a hard dependency when Sentry is not installed.
    const moduleName = "@sentry/" + "nextjs";
    const Sentry = (await import(/* webpackIgnore: true */ moduleName)) as {
      init: (options: Record<string, unknown>) => void;
    };
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  } catch {
    // Package not installed — monitoring remains disabled.
  }
}
