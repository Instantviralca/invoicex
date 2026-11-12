import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import {
  contactSubmissions,
  emailLogs,
  subscriptions,
  users,
  webhookFailures,
  workspaces,
} from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminSignOutButton } from "@/components/admin/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Admin | InvoiceX",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { q } = await searchParams;
  const query = q?.trim();

  const [userCount] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const [wsCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(workspaces);
  const [failCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(webhookFailures)
    .where(sql`${webhookFailures.resolvedAt} is null`);
  const [emailFailCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(emailLogs)
    .where(eq(emailLogs.status, "failed"));

  const workspaceRows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      planId: workspaces.planId,
      ownerId: workspaces.ownerId,
      mollieCustomerId: subscriptions.mollieCustomerId,
      mollieSubscriptionId: subscriptions.mollieSubscriptionId,
      status: subscriptions.status,
    })
    .from(workspaces)
    .leftJoin(subscriptions, eq(subscriptions.workspaceId, workspaces.id))
    .where(
      query
        ? or(
            ilike(workspaces.name, `%${query}%`),
            ilike(workspaces.slug, `%${query}%`),
          )
        : undefined,
    )
    .orderBy(desc(workspaces.createdAt))
    .limit(50);

  const userRows = query
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          suspendedAt: users.suspendedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(or(ilike(users.email, `%${query}%`), ilike(users.name, `%${query}%`)))
        .limit(50)
    : await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          suspendedAt: users.suspendedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(25);

  const contacts = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Internal admin
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              InvoiceX operations
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{session.email}</span>
            <AdminSignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Users
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{userCount?.c ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{wsCount?.c ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Open webhook failures
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{failCount?.c ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Failed emails
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {emailFailCount?.c ?? 0}
            </CardContent>
          </Card>
        </div>

        <form className="flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by user email or workspace name"
            className="max-w-md"
          />
          <Button type="submit">Search</Button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Workspaces</h2>
            <Link href="/admin/webhooks" className="text-sm text-blue-700 hover:underline">
              Webhook failures
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Mollie customer</th>
                  <th className="px-3 py-2 font-medium">Mollie subscription</th>
                </tr>
              </thead>
              <tbody>
                {workspaceRows.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/workspaces/${w.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {w.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 capitalize">{w.planId}</td>
                    <td className="px-3 py-2">{w.status ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {w.mollieCustomerId ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {w.mollieSubscriptionId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Users</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">
                      {u.suspendedAt ? (
                        <span className="text-red-600">Suspended</span>
                      ) : (
                        <span className="text-emerald-700">Active</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {u.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">
            Recent contact submissions
          </h2>
          <div className="space-y-2">
            {contacts.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-1 py-4 text-sm">
                  <p className="font-medium text-slate-900">
                    {c.subject}{" "}
                    <span className="font-normal text-slate-500">({c.category})</span>
                  </p>
                  <p className="text-slate-600">
                    {c.name} &lt;{c.email}&gt;
                  </p>
                  <p className="whitespace-pre-wrap text-slate-700">{c.message}</p>
                </CardContent>
              </Card>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-slate-500">No contact submissions yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
