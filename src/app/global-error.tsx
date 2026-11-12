"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1>InvoiceX is temporarily unavailable</h1>
        <p>
          Please try again shortly. If you need help, email sales@invoicex.store.
        </p>
        <button type="button" onClick={reset} style={{ marginTop: "1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
