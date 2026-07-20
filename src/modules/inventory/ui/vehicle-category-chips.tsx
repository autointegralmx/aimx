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
 * Mobile category chips — horizontal scroll, sticky under header.
 * Hidden on desktop (md+); desktop keeps existing category buttons.
 */
export function VehicleCategoryChips({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className={`sticky top-14 z-40 -mx-4 border-b border-border-subtle bg-page-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden ${className}`}
    >
      <nav
        aria-label="Categorías"
        className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip) => {
          const active =
            chip.href === "/vehiculos"
              ? pathname === "/vehiculos"
              : pathname.startsWith(chip.href);
          return (
            <Link
              key={chip.href}
              href={chip.href}
              className={`inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-border-subtle bg-surface-primary text-text-primary"
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
