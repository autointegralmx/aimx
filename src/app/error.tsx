"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", {
      errorName: error.name,
      errorMessage: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-page-background px-5 text-center text-text-primary">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
        Auto Integral
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
        No pudimos cargar esta página
      </h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary sm:text-base">
        Ocurrió un error temporal. Puedes reintentar o volver al inicio.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          Reintentar
        </button>
        <Link href="/" className="btn-secondary">
          Ir al inicio
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 text-xs text-text-secondary">Ref: {error.digest}</p>
      ) : null}
    </div>
  );
}
