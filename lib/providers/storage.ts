import crypto from "node:crypto";
import { env } from "@/lib/env";

export type StorageUploadInput = {
  ownerType: string;
  ownerId: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  bytes?: Buffer;
};

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeStorageKey(input: StorageUploadInput) {
  const stamp = Date.now().toString(36);
  return `${safeSegment(input.ownerType)}/${safeSegment(input.ownerId)}/${safeSegment(input.purpose)}/${stamp}-${safeSegment(input.fileName)}`;
}

function r2Configured() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function signingKey(secret: string, date: string) {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function sha256Hex(value: Buffer | string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function putR2Object(key: string, bytes: Buffer, mimeType: string) {
  if (!r2Configured()) throw new Error("R2 storage is not configured.");

  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const path = `/${env.R2_BUCKET}/${encodedKey}`;
  const url = `https://${host}${path}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(bytes);
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", signingKey(env.R2_SECRET_ACCESS_KEY!, dateStamp)).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": mimeType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: new Uint8Array(bytes) as BodyInit,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}: ${await response.text()}`);
  }
}

export async function createStorageUpload(input: StorageUploadInput) {
  const key = makeStorageKey(input);
  const checksum = input.bytes ? sha256Hex(input.bytes) : undefined;
  const provider = env.STORAGE_PROVIDER_MODE === "r2" && input.bytes && r2Configured() ? "r2" : "database";

  if (provider === "r2" && input.bytes) {
    await putR2Object(key, input.bytes, input.mimeType);
  }

  return {
    provider,
    storageKey: key,
    checksum,
    url: provider === "r2" && env.R2_PUBLIC_BASE_URL ? `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : undefined,
  };
}

export function getStorageReadUrl(asset: { provider: string; storageKey: string | null; url: string | null }) {
  if (asset.url) return asset.url;
  if (asset.provider === "r2" && asset.storageKey && env.R2_PUBLIC_BASE_URL) {
    return `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${asset.storageKey}`;
  }
  return null;
}
