import { type ZodSchema } from "zod";

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Invalid request body.");
  }

  return schema.parse(body);
}
