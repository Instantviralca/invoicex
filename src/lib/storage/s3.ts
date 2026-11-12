import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { del, get, put } from "@vercel/blob";
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

type StorageBackend = "vercel-blob" | "s3";

function getBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || token === "replace_me") return null;
  return token;
}

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

function resolveStorageBackend(): StorageBackend | null {
  const preference = process.env.STORAGE_BACKEND?.trim().toLowerCase();

  if (preference === "s3") {
    return getS3Client() ? "s3" : null;
  }
  if (preference === "vercel-blob") {
    return getBlobToken() ? "vercel-blob" : null;
  }

  if (getBlobToken()) return "vercel-blob";
  if (getS3Client()) return "s3";
  return null;
}

function getBucket(): string {
  return process.env.S3_BUCKET?.trim() ?? "invoicerush-dev";
}

function blobAccessForPurpose(
  purpose: StoragePurpose,
): "public" | "private" {
  return purpose === "logo" ? "public" : "private";
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

async function persistObject(
  storageKey: string,
  buffer: Buffer,
  mimeType: string,
  purpose: StoragePurpose,
): Promise<string | undefined> {
  const backend = resolveStorageBackend();

  if (backend === "vercel-blob") {
    const blob = await put(storageKey, buffer, {
      access: blobAccessForPurpose(purpose),
      contentType: mimeType,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: getBlobToken() ?? undefined,
    });
    return purpose === "logo" ? blob.url : undefined;
  }

  if (backend === "s3") {
    const client = getS3Client()!;
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return publicBase ? `${publicBase}/${storageKey}` : undefined;
  }

  if (process.env.NODE_ENV === "development") {
    return undefined;
  }

  throw new Error("Object storage is not configured.");
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

  const publicUrl = await persistObject(
    storageKey,
    input.buffer,
    input.mimeType,
    input.purpose,
  );

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

  return {
    fileAssetId: asset!.id,
    storageKey,
    publicUrl,
  };
}

function purposeFromStorageKey(storageKey: string): StoragePurpose {
  const match = storageKey.match(/^workspaces\/[^/]+\/([^/]+)\//);
  const segment = match?.[1];
  if (
    segment === "logo" ||
    segment === "pdf" ||
    segment === "export" ||
    segment === "temp"
  ) {
    return segment;
  }
  return "pdf";
}

async function readObjectBuffer(storageKey: string): Promise<Buffer> {
  const purposeHint = purposeFromStorageKey(storageKey);
  const backend = resolveStorageBackend();

  if (backend === "vercel-blob") {
    const result = await get(storageKey, {
      access: blobAccessForPurpose(purposeHint),
      token: getBlobToken() ?? undefined,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("File not found in storage.");
    }

    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (backend === "s3") {
    const client = getS3Client()!;
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

  if (process.env.NODE_ENV === "development") {
    return Buffer.from("");
  }

  throw new Error("Object storage is not configured.");
}

export async function downloadBuffer(storageKey: string): Promise<Buffer> {
  return readObjectBuffer(storageKey);
}

export async function deleteStoredObject(storageKey: string): Promise<void> {
  const backend = resolveStorageBackend();

  if (backend === "vercel-blob") {
    await del(storageKey, { token: getBlobToken() ?? undefined });
    return;
  }

  if (backend === "s3") {
    const client = getS3Client()!;
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: storageKey,
      }),
    );
  }
}

export function isStorageConfigured(): boolean {
  return resolveStorageBackend() !== null;
}

export function getActiveStorageBackend(): StorageBackend | null {
  return resolveStorageBackend();
}
