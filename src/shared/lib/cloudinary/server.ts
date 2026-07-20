import "server-only";

import { v2 as cloudinary } from "cloudinary";
import {
  cloudinaryEnvDiagnostics,
  requireCloudinaryEnv,
  type CloudinaryEnv,
} from "@/shared/lib/cloudinary/env";

let configured = false;

/**
 * Configures the official Cloudinary SDK once per process.
 * Server-only — never import this module from client components.
 */
export function getCloudinaryConfig(): CloudinaryEnv {
  const env = requireCloudinaryEnv();
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return env;
}

/** Configured SDK instance (side-effect: applies env). */
export function getCloudinary(): typeof cloudinary {
  getCloudinaryConfig();
  return cloudinary;
}

export function logCloudinaryServerError(
  scope: string,
  error: unknown,
  extra: Record<string, unknown> = {},
): void {
  console.error(`[${scope}]`, {
    ...cloudinaryEnvDiagnostics(),
    errorName: error instanceof Error ? error.name : "unknown",
    errorMessage: error instanceof Error ? error.message : String(error),
    ...extra,
  });
}
