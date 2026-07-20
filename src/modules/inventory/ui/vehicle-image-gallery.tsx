"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  deleteVehicleImageAction,
  reorderVehicleImagesAction,
  setVehicleCoverAction,
} from "@/modules/inventory/application/vehicle-actions";
import {
  uploadVehicleImageDirect,
  type UploadProgressPhase,
} from "@/modules/inventory/application/upload-vehicle-image-client";
import {
  MAX_VEHICLE_IMAGE_BYTES,
  MAX_VEHICLE_IMAGES,
} from "@/modules/inventory/domain/vehicle-media-rules";
import {
  mediaOrderIds,
  moveCoverToFront,
  moveMediaItem,
} from "@/modules/inventory/domain/vehicle-media-order";
import { Button } from "@/shared/ui/button";

type Props = {
  vehicleId: string;
  images: VehicleMediaItem[];
  onImagesChange: (images: VehicleMediaItem[]) => void;
};

type UploadRow = {
  id: string;
  file: File;
  fileName: string;
  byteSize: number;
  phase: UploadProgressPhase;
  progress: number;
  error?: string;
  abortController: AbortController;
};

const PHASE_LABEL: Record<UploadProgressPhase, string> = {
  preparing: "Preparando…",
  authorizing: "Solicitando autorización…",
  uploading: "Subiendo…",
  registering: "Registrando…",
  done: "Completado",
  error: "Error",
  cancelled: "Cancelado",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VehicleImageGallery({
  vehicleId,
  images,
  onImagesChange,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [pending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const uploading = uploads.some(
    (row) =>
      row.phase === "preparing" ||
      row.phase === "authorizing" ||
      row.phase === "uploading" ||
      row.phase === "registering",
  );
  const busy = pending || uploading;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function patchUpload(id: string, patch: Partial<UploadRow>) {
    setUploads((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  async function runUpload(row: UploadRow, currentCount: number) {
    try {
      const item = await uploadVehicleImageDirect({
        vehicleId,
        file: row.file,
        currentCount,
        signal: row.abortController.signal,
        onProgress: (event) => {
          patchUpload(row.id, {
            phase: event.phase,
            progress: event.progress,
            error: event.error,
          });
        },
      });
      patchUpload(row.id, { phase: "done", progress: 100 });
      return item;
    } catch (err) {
      const aborted = row.abortController.signal.aborted;
      patchUpload(row.id, {
        phase: aborted ? "cancelled" : "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Error al subir",
      });
      return null;
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (busy) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setError(null);
    setMessage(null);

    const remaining = MAX_VEHICLE_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Máximo ${MAX_VEHICLE_IMAGES} fotografías.`);
      return;
    }

    const accepted: File[] = [];
    const localErrors: string[] = [];

    for (const file of files.slice(0, remaining)) {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
          file.type,
        )
      ) {
        localErrors.push(`${file.name}: formato no permitido.`);
        continue;
      }
      if (file.size > MAX_VEHICLE_IMAGE_BYTES) {
        localErrors.push(`${file.name}: supera el límite de 10 MB.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) {
      setError(localErrors[0] ?? "Ningún archivo válido para subir.");
      return;
    }

    const rows: UploadRow[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      byteSize: file.size,
      phase: "preparing",
      progress: 0,
      abortController: new AbortController(),
    }));
    setUploads((prev) => [...rows, ...prev]);

    const uploaded: VehicleMediaItem[] = [];
    let currentCount = images.length;

    for (const row of rows) {
      const item = await runUpload(row, currentCount);
      if (item) {
        uploaded.push(item);
        currentCount += 1;
      }
    }

    if (uploaded.length > 0) {
      const next = [...images];
      for (const item of uploaded) {
        if (!next.some((row) => row.media_asset_id === item.media_asset_id)) {
          next.push(item);
        }
      }
      onImagesChange(next);
      setMessage(`Se subieron ${uploaded.length} imagen(es).`);
      refresh();
    } else if (localErrors.length === 0) {
      setError("No se pudo subir ninguna imagen.");
    }
    if (localErrors.length > 0) {
      setError(localErrors.join(" "));
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function cancelUpload(id: string) {
    const row = uploads.find((item) => item.id === id);
    row?.abortController.abort();
    patchUpload(id, { phase: "cancelled", progress: 0 });
  }

  async function retryUpload(id: string) {
    const row = uploads.find((item) => item.id === id);
    if (!row || busy) return;
    const nextRow: UploadRow = {
      ...row,
      phase: "preparing",
      progress: 0,
      error: undefined,
      abortController: new AbortController(),
    };
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? nextRow : item)),
    );
    const item = await runUpload(nextRow, images.length);
    if (item) {
      if (!images.some((row) => row.media_asset_id === item.media_asset_id)) {
        onImagesChange([...images, item]);
      }
      setMessage("Imagen subida.");
      refresh();
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files);
    }
  }

  function persistOrder(ordered: VehicleMediaItem[], successMessage: string) {
    startTransition(async () => {
      const result = await reorderVehicleImagesAction({
        vehicleId,
        orderedMediaAssetIds: mediaOrderIds(ordered),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(successMessage);
      refresh();
    });
  }

  function moveItem(from: number, to: number) {
    if (busy) return;
    const next = moveMediaItem(imagesRef.current, from, to);
    if (next === imagesRef.current) return;
    setError(null);
    onImagesChange(next);
    persistOrder(next, "Orden guardado.");
  }

  function setCover(mediaAssetId: string) {
    if (busy) return;
    startTransition(async () => {
      const result = await setVehicleCoverAction({ vehicleId, mediaAssetId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = moveCoverToFront(imagesRef.current, mediaAssetId);
      onImagesChange(next);
      setMessage("Portada actualizada y movida al inicio.");
      refresh();
    });
  }

  function removeImage(mediaAssetId: string) {
    if (busy) return;
    if (
      !window.confirm(
        "Esta fotografía se eliminará del vehículo y del almacenamiento.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteVehicleImageAction({ vehicleId, mediaAssetId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onImagesChange(
        imagesRef.current.filter((item) => item.media_asset_id !== mediaAssetId),
      );
      setMessage(result.message);
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
          dragOver ? "border-accent bg-[#f8e8e8]" : "border-line bg-surface"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p className="text-sm font-medium text-ink">
          Arrastra fotografías o selecciónalas
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          JPEG, PNG, WebP o AVIF · máx. 10 MB · hasta {MAX_VEHICLE_IMAGES}{" "}
          imágenes ({images.length}/{MAX_VEHICLE_IMAGES})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          disabled={busy || images.length >= MAX_VEHICLE_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Subiendo…" : "Seleccionar archivos"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="space-y-2" aria-live="polite">
          {uploads.map((row) => (
            <li
              key={row.id}
              className="rounded-md border border-line bg-paper-elevated px-3 py-2 text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {row.fileName}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatBytes(row.byteSize)} · {PHASE_LABEL[row.phase]}
                    {row.phase === "uploading" || row.phase === "registering"
                      ? ` · ${row.progress}%`
                      : null}
                  </p>
                  {row.error ? (
                    <p className="text-xs text-danger">{row.error}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {row.phase === "uploading" ||
                  row.phase === "authorizing" ||
                  row.phase === "preparing" ||
                  row.phase === "registering" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-ink-muted hover:text-ink"
                      onClick={() => cancelUpload(row.id)}
                    >
                      Cancelar
                    </button>
                  ) : null}
                  {row.phase === "error" || row.phase === "cancelled" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-accent"
                      disabled={busy}
                      onClick={() => void retryUpload(row.id)}
                    >
                      Reintentar
                    </button>
                  ) : null}
                </div>
              </div>
              {(row.phase === "uploading" ||
                row.phase === "registering" ||
                row.phase === "authorizing" ||
                row.phase === "preparing") && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${Math.max(row.progress, 4)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {images.length === 0 ? (
        <p className="text-sm text-ink-muted">Aún no hay fotografías.</p>
      ) : (
        <>
          <p className="text-xs text-ink-muted">
            Usa ↑ ↓ o arrastra para reordenar. El orden se guarda al instante. La
            portada queda siempre como primera foto en la ficha.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <li
                key={image.media_asset_id}
                draggable={!busy}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex == null) return;
                  moveItem(dragIndex, index);
                  setDragIndex(null);
                }}
                className="rounded-md border border-line bg-paper-elevated p-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface">
                  <Image
                    src={image.url}
                    alt={image.alt_text || image.original_filename}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized={image.provider === "supabase"}
                  />
                  {image.is_cover ? (
                    <span className="absolute left-2 top-2 rounded-sm bg-brand-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Portada
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="touch-target inline-flex items-center px-2 text-xs font-medium text-ink hover:text-accent disabled:opacity-50"
                    disabled={busy || image.is_cover}
                    onClick={() => setCover(image.media_asset_id)}
                  >
                    Usar como portada
                  </button>
                  <button
                    type="button"
                    className="touch-target inline-flex items-center px-2 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
                    disabled={busy || index === 0}
                    onClick={() => moveItem(index, index - 1)}
                    aria-label="Mover arriba"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="touch-target inline-flex items-center px-2 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
                    disabled={busy || index === images.length - 1}
                    onClick={() => moveItem(index, index + 1)}
                    aria-label="Mover abajo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="touch-target inline-flex items-center px-2 text-xs font-medium text-danger disabled:opacity-50"
                    disabled={busy}
                    onClick={() => removeImage(image.media_asset_id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
