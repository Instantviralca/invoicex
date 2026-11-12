import { notFound } from "next/navigation";
import { QuoteResponseForm } from "@/components/app/quote-response-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMoney } from "@/lib/money";
import { getQuoteByPublicToken } from "@/lib/services/quotes";

type PageProps = { params: Promise<{ token: string }> };

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getQuoteByPublicToken(token);

  if (!data) notFound();

  const { quote, lines, profile } = data;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-sm text-foreground-muted">{profile?.tradingName}</p>
        <h1 className="font-display text-3xl font-semibold">Quote {quote.quoteNumber}</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Valid until {quote.validUntil}
        </p>
      </header>

      <section className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-border">
                <td className="py-2">{line.description}</td>
                <td className="py-2">
                  {line.quantity} {line.unit}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(line.lineTotalMinor, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-right text-lg font-semibold">
          Total: {formatMoney(quote.grandTotalMinor, quote.currency)}
        </p>
      </section>

      <div className="mb-6 flex gap-3">
        <a
          href={`/api/public/quotes/${token}/pdf`}
          className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground"
        >
          Download PDF
        </a>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          Accepting or rejecting this quote records your response for the business owner.
          This is not a qualified electronic signature under UK eIDAS regulations.
        </AlertDescription>
      </Alert>

      {quote.status === "accepted" || quote.status === "rejected" ? (
        <p className="rounded-lg border border-border bg-background-muted/50 p-4 text-sm">
          This quote has been marked as {quote.status}.
        </p>
      ) : (
        <QuoteResponseForm token={token} />
      )}
    </div>
  );
}
