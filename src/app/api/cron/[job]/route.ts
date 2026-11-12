import { NextResponse } from "next/server";
import { isJobName, runJob } from "@/lib/jobs";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ job: string }> };

function authoriseCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret === "replace-with-a-long-random-secret") {
    return process.env.NODE_ENV === "development";
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return header.slice("Bearer ".length) === secret;
}

export async function POST(request: Request, context: RouteContext) {
  if (!authoriseCron(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { job } = await context.params;

  if (!isJobName(job)) {
    return NextResponse.json({ error: "Unknown job." }, { status: 404 });
  }

  try {
    const result = await runJob(job);
    logger.info({ job, result }, "Cron job invoked");
    return NextResponse.json({ job, ...result });
  } catch (error) {
    logger.error({ err: error, job }, "Cron job crashed");
    return NextResponse.json({ error: "Job execution failed." }, { status: 500 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  return POST(request, context);
}
