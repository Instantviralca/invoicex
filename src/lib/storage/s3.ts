import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { fileAssets } from "@/db/schema";

const LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const PDF_MIME_TYPE = "application/pdf";
const EXPORT_MIME_TYPES = new Set(["application/json", "application/zip"]);

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_EXPORT_BYTES = 50 * 1024 * 1024;

export type StoragePurpose = "logo" | "pdf" | "export" | "temp";

function getS3Client(): S3Client | null {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION?.trim() ?? "eu-west-2";

  if (
    !accessKeyId ||
    !secretAccessKey ||
    accessKeyId === "replace_me" ||
    secretAccessKey === "replace_me"
  ) {
    return null;
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint && !endpoint.includes("amazonaws.com")),
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket(): string {
  return process.env.S3_BUCKET?.trim() ?? "invoicerush-dev";
}

function sanitiseFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\.\./g, "")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120) || "file";
}

export function buildStorageKey(
  workspaceId: string,
  purpose: StoragePurpose,
  filename: string,
): string {
  const safeName = sanitiseFilename(filename);
  return `workspaces/${workspaceId}/${purpose}/${nanoid(12)}-${safeName}`;
}

function maxBytesForPurpose(purpose: StoragePurpose): number {
  switch (purpose) {
    case "logo":
      return MAX_LOGO_BYTES;
    case "pdf":
      return MAX_PDF_BYTES;
    case "export":
      return MAX_EXPORT_BYTES;
    case "temp":
      return MAX_PDF_BYTES;
    default:
      return MAX_PDF_BYTES;
  }
}

export function validateUpload(
  purpose: StoragePurpose,
  mimeType: string,
  sizeBytes: number,
): void {
  const maxBytes = maxBytesForPurpose(purpose);

  if (sizeBytes <= 0 || sizeBytes > maxBytes) {
    throw new Error(
      `File exceeds the maximum size of ${Math.round(maxBytes / (1024 * 1024))} MB.`,
    );
  }

  if (purpose === "logo" && !LOGO_MIME_TYPES.has(mimeType)) {
    throw new Error("Logo uploads must be PNG, JPEG, or WebP.");
  }

  if (purpose === "pdf" && mimeType !== PDF_MIME_TYPE) {
    throw new Error("Only PDF files are allowed for this upload.");
  }

  if (purpose === "export" && !EXPORT_MIME_TYPES.has(mimeType)) {
    throw new Error("Export uploads must be JSON or ZIP.");
  }
}

export async function uploadBuffer(input: {
  workspaceId: string;
  purpose: StoragePurpose;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  uploadedByUserId?: string;
}): Promise<{ fileAssetId: string; storageKey: string; publicUrl?: string }> {
  validateUpload(input.purpose, input.mimeType, input.buffer.length);

  const storageKey = buildStorageKey(
    input.workspaceId,
    input.purpose,
    input.filename,
  );

  const client = getS3Client();
  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: storageKey,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );
  } else if (process.env.NODE_ENV === "development") {
    // Development fallback: record metadata without remote storage.
  } else {
    throw new Error("Object storage is not configured.");
  }

  const [asset] = await db
    .insert(fileAssets)
    .values({
      workspaceId: input.workspaceId,
      uploadedByUserId: input.uploadedByUserId ?? null,
      storageKey,
      filename: sanitiseFilename(input.filename),
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      purpose: input.purpose,
    })
    .returning({ id: fileAssets.id });

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const publicUrl = publicBase ? `${publicBase}/${storageKey}` : undefined;

  return {
    fileAssetId: asset!.id,
    storageKey,
    publicUrl,
  };
}

export async function downloadBuffer(storageKey: string): Promise<Buffer> {
  const client = getS3Client();
  if (!client) {
    if (process.env.NODE_ENV === "development") {
      return Buffer.from("");
    }
    throw new Error("Object storage is not configured.");
  }

  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: storageKey,
    }),
  );

  const body = response.Body;
  if (!body) throw new Error("File not found in storage.");

  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteStoredObject(storageKey: string): Promise<void> {
  const client = getS3Client();
  if (!client) return;

  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: storageKey,
    }),
  );
}

export function isStorageConfigured(): boolean {
  return getS3Client() !== null;
}
