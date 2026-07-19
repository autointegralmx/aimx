"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

const vehicleLinks = [
  { href: "/vehiculos/accidentados", label: "Accidentados" },
  { href: "/vehiculos/recuperados", label: "Recuperados" },
  { href: "/vehiculos/seminuevos", label: "Seminuevos" },
];

const servicesMenuPreview = [
  "Diagnóstico con scanner",
  "Mecánica",
  "Suspensión",
  "Frenos",
  "Hojalatería y pintura",
  "Detallado",
  "Programación de llaves",
  "Duplicados",
  "Apertura de vehículos",
];

type NavItem = {
  href: string;
  label: string;
  kind?: "vehicles" | "services";
};

const nav: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/vehiculos", label: "Vehículos", kind: "vehicles" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/servicios", label: "Servicios", kind: "services" },
  { href: "/como-comprar", label: "Cómo Comprar" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [desktopVehiclesOpen, setDesktopVehiclesOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-primary">
      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-[4.25rem]">
        <BrandLogo variant="header" priority />

        <nav
          aria-label="Principal"
          className="hidden items-center gap-5 xl:flex 2xl:gap-6"
        >
          {nav.map((item) => {
            const active = isActive(item.href);

            if (item.kind === "vehicles") {
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setDesktopVehiclesOpen(true)}
                  onMouseLeave={() => setDesktopVehiclesOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`touch-target inline-flex items-center gap-1 text-[15px] font-medium transition-colors ${
                      active
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    aria-expanded={desktopVehiclesOpen}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <span aria-hidden className="text-[10px]">
                      ▾
                    </span>
                  </Link>
                  {active ? (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-brand-red" />
                  ) : null}
                  {desktopVehiclesOpen ? (
                    <div className="absolute left-0 top-full z-50 min-w-52 pt-3">
                      <div className="border border-border-subtle bg-surface-primary py-2 shadow-card">
                        {vehicleLinks.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                            onClick={() => setDesktopVehiclesOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                        <Link
                          href="/vehiculos"
                          className="mt-1 block border-t border-border-subtle px-4 py-2.5 text-sm font-semibold text-brand-red"
                          onClick={() => setDesktopVehiclesOpen(false)}
                        >
                          Ver todos los vehículos
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            }

            if (item.kind === "services") {
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setDesktopServicesOpen(true)}
                  onMouseLeave={() => setDesktopServicesOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`touch-target inline-flex items-center gap-1 text-[15px] font-medium transition-colors ${
                      active
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    aria-expanded={desktopServicesOpen}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <span aria-hidden className="text-[10px]">
                      ▾
                    </span>
                  </Link>
                  {active ? (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-brand-red" />
                  ) : null}
                  {desktopServicesOpen ? (
                    <div className="absolute left-1/2 top-full z-50 w-[min(92vw,20rem)] -translate-x-1/2 pt-3">
                      <div className="max-h-[min(80vh,36rem)] overflow-y-auto border border-border-subtle bg-surface-primary p-5 shadow-card">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
                          Servicios
                        </p>
                        <ul className="mt-4 space-y-1.5">
                          {servicesMenuPreview.map((label) => (
                            <li key={label}>
                              <Link
                                href="/servicios"
                                className="block text-sm text-text-secondary hover:text-text-primary"
                                onClick={() => setDesktopServicesOpen(false)}
                              >
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/servicios"
                          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand-red hover:underline"
                          onClick={() => setDesktopServicesOpen(false)}
                        >
                          Ver todos los servicios →
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`touch-target relative inline-flex items-center text-[15px] font-medium transition-colors ${
                  active
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-brand-red" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <WhatsAppCta
            message={whatsappMessages.hero}
            variant="dark"
            className="hidden sm:inline-flex"
          />
          <button
            type="button"
            className="touch-target inline-flex items-center justify-center border border-border-subtle px-3 text-sm font-medium text-text-primary xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Móvil"
          className="border-t border-border-subtle bg-surface-primary xl:hidden"
        >
          <ul className="container-site flex flex-col py-2">
            {nav.map((item) => {
              if (item.kind === "vehicles") {
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      className="touch-target flex w-full items-center justify-between py-3 text-left text-base font-medium text-text-primary"
                      aria-expanded={vehiclesOpen}
                      onClick={() => setVehiclesOpen((v) => !v)}
                    >
                      {item.label}
                      <span aria-hidden>{vehiclesOpen ? "−" : "+"}</span>
                    </button>
                    {vehiclesOpen ? (
                      <ul className="mb-2 border-l border-border-subtle pl-4">
                        {vehicleLinks.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="touch-target flex items-center py-2.5 text-sm text-text-secondary"
                              onClick={() => setOpen(false)}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="touch-target flex items-center py-3 text-base font-medium text-text-primary"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="pb-4 pt-2">
              <WhatsAppCta
                message={whatsappMessages.hero}
                variant="dark"
                className="w-full"
                onClick={() => setOpen(false)}
              />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
