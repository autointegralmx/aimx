"use client";

import { createCloudinaryUploadSignatureAction } from "@/modules/inventory/application/cloudinary-sign-action";
import { registerCloudinaryVehicleImageAction } from "@/modules/inventory/application/vehicle-actions";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  sniffImageMimeFromFile,
  isRejectedImageMime,
} from "@/modules/inventory/domain/image-mime-sniff";
import {
  isAllowedVehicleImageMime,
  validateVehicleImageFile,
} from "@/modules/inventory/domain/vehicle-media-rules";

export type UploadProgressPhase =
  | "preparing"
  | "authorizing"
  | "uploading"
  | "registering"
  | "done"
  | "error"
  | "cancelled";

export type UploadProgressEvent = {
  phase: UploadProgressPhase;
  progress: number;
  fileName: string;
  byteSize: number;
  error?: string;
};

type CloudinaryUploadApiResponse = {
  public_id?: string;
  secure_url?: string;
  resource_type?: string;
  version?: number;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  original_filename?: string;
  error?: { message?: string };
};

/**
 * Browser → Cloudinary signed upload → register metadata in Postgres.
 * Image bytes never touch Vercel.
 */
export async function uploadVehicleImageDirect(input: {
  vehicleId: string;
  file: File;
  currentCount: number;
  signal?: AbortSignal;
  onProgress?: (event: UploadProgressEvent) => void;
}): Promise<VehicleMediaItem> {
  const emit = (event: Omit<UploadProgressEvent, "fileName" | "byteSize">) => {
    input.onProgress?.({
      ...event,
      fileName: input.file.name,
      byteSize: input.file.size,
    });
  };

  emit({ phase: "preparing", progress: 5 });

  if (input.signal?.aborted) {
    emit({ phase: "cancelled", progress: 0 });
    throw new Error("Subida cancelada.");
  }

  const declaredMime = input.file.type || "application/octet-stream";
  if (isRejectedImageMime(declaredMime)) {
    throw new Error("Tipo de archivo no permitido.");
  }

  const sniffed = await sniffImageMimeFromFile(input.file);
  const mimeType = sniffed ?? declaredMime;

  if (!sniffed) {
    throw new Error(
      "No se pudo verificar el tipo de imagen. Usa JPEG, PNG, WebP o AVIF.",
    );
  }

  const validation = validateVehicleImageFile({
    mimeType,
    byteSize: input.file.size,
    currentCount: input.currentCount,
  });
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  if (!isAllowedVehicleImageMime(mimeType)) {
    throw new Error("Formato no permitido. Usa JPEG, PNG, WebP o AVIF.");
  }

  const assetId = crypto.randomUUID();

  emit({ phase: "authorizing", progress: 15 });
  const signed = await createCloudinaryUploadSignatureAction({
    vehicleId: input.vehicleId,
    assetId,
  });
  if (!signed.ok) {
    emit({ phase: "error", progress: 0, error: signed.error });
    throw new Error(signed.error);
  }

  if (input.signal?.aborted) {
    emit({ phase: "cancelled", progress: 0 });
    throw new Error("Subida cancelada.");
  }

  emit({ phase: "uploading", progress: 25 });

  const cloudinaryResponse = await uploadFileToCloudinary({
    file: input.file,
    cloudName: signed.data.cloudName,
    apiKey: signed.data.apiKey,
    timestamp: signed.data.timestamp,
    signature: signed.data.signature,
    folder: signed.data.folder,
    publicId: signed.data.publicId,
    signal: input.signal,
    onProgress: (pct) => {
      emit({
        phase: "uploading",
        progress: 25 + Math.round(pct * 0.55),
      });
    },
  });

  if (cloudinaryResponse.public_id !== signed.data.fullPublicId) {
    throw new Error(
      "Cloudinary devolvió un public_id inesperado. No se registró la imagen.",
    );
  }

  emit({ phase: "registering", progress: 85 });

  const registered = await registerCloudinaryVehicleImageAction({
    vehicleId: input.vehicleId,
    assetId,
    publicId: cloudinaryResponse.public_id,
    secureUrl: cloudinaryResponse.secure_url ?? null,
    resourceType: cloudinaryResponse.resource_type ?? "image",
    version: cloudinaryResponse.version ?? null,
    format: cloudinaryResponse.format ?? null,
    width: cloudinaryResponse.width ?? null,
    height: cloudinaryResponse.height ?? null,
    byteSize: cloudinaryResponse.bytes ?? input.file.size,
    fileName: input.file.name,
    mimeType,
  });

  if (!registered.ok) {
    emit({ phase: "error", progress: 0, error: registered.error });
    throw new Error(registered.error);
  }

  emit({ phase: "done", progress: 100 });
  return registered.uploaded;
}

function uploadFileToCloudinary(input: {
  file: File;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  signal?: AbortSignal;
  onProgress?: (fraction01: number) => void;
}): Promise<CloudinaryUploadApiResponse> {
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(input.cloudName)}/image/upload`;
  const form = new FormData();
  form.append("file", input.file);
  form.append("api_key", input.apiKey);
  form.append("timestamp", String(input.timestamp));
  form.append("signature", input.signature);
  form.append("folder", input.folder);
  form.append("public_id", input.publicId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(event.loaded / event.total);
    };

    xhr.onload = () => {
      const body = (xhr.response ?? {}) as CloudinaryUploadApiResponse;
      if (xhr.status >= 200 && xhr.status < 300 && body.public_id) {
        resolve(body);
        return;
      }
      reject(
        new Error(
          body.error?.message ??
            `Cloudinary rechazó la subida (HTTP ${xhr.status}).`,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error("Error de red al subir a Cloudinary."));
    };

    xhr.onabort = () => {
      reject(new Error("Subida cancelada."));
    };

    if (input.signal) {
      if (input.signal.aborted) {
        xhr.abort();
        return;
      }
      input.signal.addEventListener("abort", () => xhr.abort(), {
        once: true,
      });
    }

    xhr.send(form);
  });
}
