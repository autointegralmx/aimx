"use client";

import { useCallback, useEffect, useState } from "react";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";

type Props = {
  images: VehicleMediaItem[];
  alt: string;
};

export function PublicVehicleGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const active = images[index] ?? images[0];

  const go = useCallback(
    (next: number) => {
      if (total <= 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total <= 1) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, total]);

  if (!active) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-surface-secondary text-sm text-text-secondary">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden bg-surface-secondary">
        <div className="aspect-[4/3] md:aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.alt_text || alt}
            className="h-full w-full object-cover"
          />
        </div>
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Fotografía anterior"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
              onClick={() => go(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Fotografía siguiente"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
              onClick={() => go(index + 1)}
            >
              ›
            </button>
            <p className="absolute bottom-3 right-3 rounded-sm bg-black/50 px-2 py-1 text-xs text-white">
              {index + 1} / {total}
            </p>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <ul className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-7">
          {images.map((image, i) => {
            const selected = i === index;
            return (
              <li key={image.media_asset_id}>
                <button
                  type="button"
                  aria-label={`Ver fotografía ${i + 1}`}
                  aria-current={selected ? "true" : undefined}
                  className={`aspect-square w-full overflow-hidden bg-surface-secondary transition ${
                    selected
                      ? "ring-2 ring-brand-red ring-offset-1 ring-offset-page-background"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setIndex(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
