/**
 * Typed Cloudinary env reads. Never log secret values.
 * CLOUDINARY_API_SECRET must stay server-only (no NEXT_PUBLIC_).
 */
import { z } from "zod";

const cloudinaryEnvSchema = z.object({
  cloudName: z.string().trim().min(1),
  apiKey: z.string().trim().min(1),
  apiSecret: z.string().trim().min(1),
});

export type CloudinaryEnv = z.infer<typeof cloudinaryEnvSchema>;

export type CloudinaryEnvReadResult =
  | { configured: true; env: CloudinaryEnv }
  | { configured: false; env: null; missing: string[] };

function missingCloudinaryKeys(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()) {
    missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  }
  if (!process.env.CLOUDINARY_API_KEY?.trim()) {
    missing.push("CLOUDINARY_API_KEY");
  }
  if (!process.env.CLOUDINARY_API_SECRET?.trim()) {
    missing.push("CLOUDINARY_API_SECRET");
  }
  return missing;
}

export function readCloudinaryEnv(): CloudinaryEnvReadResult {
  const missing = missingCloudinaryKeys();
  if (missing.length > 0) {
    return { configured: false, env: null, missing };
  }

  const parsed = cloudinaryEnvSchema.safeParse({
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  });

  if (!parsed.success) {
    return {
      configured: false,
      env: null,
      missing: missingCloudinaryKeys(),
    };
  }

  return { configured: true, env: parsed.data };
}

export function requireCloudinaryEnv(): CloudinaryEnv {
  const result = readCloudinaryEnv();
  if (!result.configured) {
    throw new Error(
      `Cloudinary no está configurado. Define: ${result.missing.join(", ")}. ` +
        "CLOUDINARY_API_SECRET solo en servidor (.env.local / Vercel), nunca NEXT_PUBLIC_.",
    );
  }
  return result.env;
}

/** Safe diagnostic flags — never includes secret values. */
export function cloudinaryEnvDiagnostics(): {
  configured: boolean;
  hasCloudName: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
} {
  return {
    configured: readCloudinaryEnv().configured,
    hasCloudName: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()),
    hasApiKey: Boolean(process.env.CLOUDINARY_API_KEY?.trim()),
    hasApiSecret: Boolean(process.env.CLOUDINARY_API_SECRET?.trim()),
  };
}
