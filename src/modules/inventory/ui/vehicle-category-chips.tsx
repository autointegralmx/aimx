"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const chips = [
  { href: "/vehiculos", label: "Todos" },
  { href: "/vehiculos/accidentados", label: "Accidentados" },
  { href: "/vehiculos/recuperados", label: "Recuperados" },
  { href: "/vehiculos/seminuevos", label: "Seminuevos" },
];

/**
 * Menú local de categorías — visible en móvil y escritorio,
 * sticky bajo el header para cambiar sin subir al nav principal.
 */
export function VehicleCategoryChips({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className={`sticky top-[4.25rem] z-30 -mx-4 border-b border-border-subtle bg-page-background/95 px-4 py-3 md:top-[4.5rem] md:mx-0 md:border md:border-border-subtle md:bg-surface-primary md:px-1 md:py-1 ${className}`}
    >
      <nav
        aria-label="Categorías de vehículos"
        className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip) => {
          const active =
            chip.href === "/vehiculos"
              ? pathname === "/vehiculos" || pathname === "/"
              : pathname.startsWith(chip.href);
          return (
            <Link
              key={chip.href}
              href={chip.href}
              className={`touch-target inline-flex shrink-0 items-center px-3.5 text-[13px] font-semibold tracking-wide transition-colors md:px-4 md:text-[14px] ${
                active
                  ? "bg-brand-black text-white"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
