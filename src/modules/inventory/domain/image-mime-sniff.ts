/**
 * Lightweight magic-byte / MIME sniffing for vehicle images.
 * Does not replace server-side Cloudinary format checks.
 */

export type SniffedImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | null;

export function sniffImageMimeFromBytes(bytes: ArrayBuffer | Uint8Array): SniffedImageMime {
  const view =
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (view.length < 12) return null;

  // JPEG FF D8 FF
  if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG 89 50 4E 47
  if (
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return "image/webp";
  }

  // AVIF: ....ftyp....avif / avis / mif1
  if (
    view[4] === 0x66 &&
    view[5] === 0x74 &&
    view[6] === 0x79 &&
    view[7] === 0x70
  ) {
    const brand = String.fromCharCode(
      view[8] ?? 0,
      view[9] ?? 0,
      view[10] ?? 0,
      view[11] ?? 0,
    );
    if (brand === "avif" || brand === "avis" || brand === "mif1") {
      return "image/avif";
    }
  }

  return null;
}

export async function sniffImageMimeFromFile(file: File): Promise<SniffedImageMime> {
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  return sniffImageMimeFromBytes(buffer);
}

export function isRejectedImageMime(mime: string): boolean {
  const normalized = mime.toLowerCase().trim();
  return (
    normalized === "image/svg+xml" ||
    normalized === "application/pdf" ||
    normalized === "application/octet-stream" ||
    normalized.startsWith("application/x-") ||
    normalized.startsWith("application/javascript") ||
    normalized === "text/html"
  );
}
