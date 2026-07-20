import "server-only";

import { requireCloudinaryEnv } from "@/shared/lib/cloudinary/env";
import { createCloudinarySignature } from "@/shared/lib/cloudinary/signature";

/**
 * Cloudinary signed upload params (server-only).
 * Never include api_secret in the returned payload.
 */
export function signCloudinaryUploadParams(
  params: Record<string, string | number>,
): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
} {
  const env = requireCloudinaryEnv();
  const timestamp =
    typeof params.timestamp === "number"
      ? params.timestamp
      : Number(params.timestamp);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    throw new Error("timestamp de firma inválido.");
  }

  const signature = createCloudinarySignature(params, env.apiSecret);

  return {
    signature,
    timestamp,
    cloudName: env.cloudName,
    apiKey: env.apiKey,
  };
}
