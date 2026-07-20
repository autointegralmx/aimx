"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  deleteVehicleImageAction,
  reorderVehicleImagesAction,
  setVehicleCoverAction,
} from "@/modules/inventory/application/vehicle-actions";
import { uploadVehicleImageDirect } from "@/modules/inventory/application/upload-vehicle-image-client";
import {
  MAX_VEHICLE_IMAGE_BYTES,
  MAX_VEHICLE_IMAGES,
} from "@/modules/inventory/domain/vehicle-media-rules";
import { Button } from "@/shared/ui/button";

type Props = {
  vehicleId: string;
  images: VehicleMediaItem[];
  onImagesChange: (images: VehicleMediaItem[]) => void;
};

export function VehicleImageGallery({
  vehicleId,
  images,
  onImagesChange,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<
    Array<{ fileName: string; error: string }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const busy = pending || uploading;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function handleFiles(fileList: FileList | File[]) {
    if (busy) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setError(null);
    setMessage(null);
    setFileErrors([]);

    const remaining = MAX_VEHICLE_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Máximo ${MAX_VEHICLE_IMAGES} fotografías.`);
      return;
    }

    const accepted: File[] = [];
    const localErrors: Array<{ fileName: string; error: string }> = [];

    for (const file of files.slice(0, remaining)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        localErrors.push({
          fileName: file.name,
          error: "Formato no permitido. Usa JPEG, PNG o WebP.",
        });
        continue;
      }
      if (file.size > MAX_VEHICLE_IMAGE_BYTES) {
        localErrors.push({
          fileName: file.name,
          error: "Supera el límite de 10 MB.",
        });
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) {
      setFileErrors(localErrors);
      setError("Ningún archivo válido para subir.");
      return;
    }

    setUploading(true);
    const uploaded: VehicleMediaItem[] = [];
    const uploadErrors = [...localErrors];
    let currentCount = images.length;

    try {
      for (const file of accepted) {
        try {
          const item = await uploadVehicleImageDirect({
            vehicleId,
            file,
            currentCount,
          });
          uploaded.push(item);
          currentCount += 1;
        } catch (err) {
          uploadErrors.push({
            fileName: file.name,
            error: err instanceof Error ? err.message : "Error al subir",
          });
        }
      }

      if (uploaded.length === 0) {
        setError(
          uploadErrors[0]?.error ?? "No se pudo subir ninguna imagen.",
        );
        setFileErrors(uploadErrors);
        return;
      }

      const next = [...images];
      for (const item of uploaded) {
        if (!next.some((row) => row.media_asset_id === item.media_asset_id)) {
          next.push(item);
        }
      }
      onImagesChange(next);
      setFileErrors(uploadErrors);
      setMessage(
        uploadErrors.length > localErrors.length
          ? `Se subieron ${uploaded.length} imagen(es). Algunas fallaron.`
          : `Se subieron ${uploaded.length} imagen(es).`,
      );
      refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files);
    }
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onImagesChange(next);
  }

  function persistOrder() {
    if (busy) return;
    startTransition(async () => {
      const result = await reorderVehicleImagesAction({
        vehicleId,
        orderedMediaAssetIds: images.map((item) => item.media_asset_id),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      refresh();
    });
  }

  function setCover(mediaAssetId: string) {
    if (busy) return;
    startTransition(async () => {
      const result = await setVehicleCoverAction({ vehicleId, mediaAssetId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onImagesChange(
        images.map((item) => ({
          ...item,
          is_cover: item.media_asset_id === mediaAssetId,
        })),
      );
      setMessage(result.message);
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
        images.filter((item) => item.media_asset_id !== mediaAssetId),
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
          JPEG, PNG o WebP · máx. 10 MB · hasta {MAX_VEHICLE_IMAGES} imágenes (
          {images.length}/{MAX_VEHICLE_IMAGES})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
      {fileErrors.length > 0 ? (
        <ul className="space-y-1 text-xs text-danger" role="alert">
          {fileErrors.map((item) => (
            <li key={`${item.fileName}-${item.error}`}>
              {item.fileName}: {item.error}
            </li>
          ))}
        </ul>
      ) : null}

      {images.length === 0 ? (
        <p className="text-sm text-ink-muted">Aún no hay fotografías.</p>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <li
                key={image.media_asset_id}
                draggable
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt_text || image.original_filename}
                    className="h-full w-full object-cover"
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
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={persistOrder}
          >
            Guardar orden
          </Button>
        </>
      )}
    </div>
  );
}
