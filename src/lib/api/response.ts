import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError } from "@/lib/permissions";
import { PlanLimitError } from "@/lib/entitlements";
import { BillingError } from "@/lib/mollie/subscriptions";
import { WorkspaceAccessError } from "@/lib/workspace";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return jsonError(first?.message ?? "Validation failed.", 400, {
      issues: error.flatten(),
    });
  }

  if (error instanceof PlanLimitError) {
    return jsonError(error.message, 403, { code: error.code });
  }

  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403, { permission: error.permission });
  }

  if (error instanceof BillingError) {
    return jsonError(error.message, 400, { code: error.code });
  }

  if (error instanceof WorkspaceAccessError) {
    return jsonError(error.message, 403);
  }

  if (error instanceof Error) {
    if (error.message === "NotFound") {
      return jsonError("The requested resource was not found.", 404);
    }
    return jsonError(error.message, 400);
  }

  return jsonError("Something went wrong. Please try again.", 500);
}
