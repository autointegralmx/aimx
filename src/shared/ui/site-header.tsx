"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

const vehicleLinks = [
  { href: "/vehiculos", label: "Todos" },
  { href: "/vehiculos/accidentados", label: "Accidentados" },
  { href: "/vehiculos/recuperados", label: "Recuperados" },
  { href: "/vehiculos/seminuevos", label: "Seminuevos" },
];

const servicesLinks = [
  { href: "/servicios", label: "Diagnóstico y mecánica" },
  { href: "/servicios", label: "Hojalatería y pintura" },
  { href: "/servicios", label: "Estética automotriz" },
  { href: "/servicios/llaves-automotrices", label: "Llaves automotrices" },
];

type NavItem = {
  href: string;
  label: string;
  kind?: "vehicles" | "services";
};

const nav: NavItem[] = [
  { href: "/vehiculos", label: "Vehículos", kind: "vehicles" },
  { href: "/subastas", label: "Subastas" },
  { href: "/como-comprar", label: "Cómo comprar" },
  { href: "/servicios", label: "Servicios", kind: "services" },
  { href: "/nosotros", label: "Nosotros" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return <SiteHeaderChrome key={pathname} pathname={pathname} />;
}

function SiteHeaderChrome({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [desktopVehiclesOpen, setDesktopVehiclesOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);
  const vehiclesMenuId = useId();
  const servicesMenuId = useId();
  const vehiclesRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      setDesktopVehiclesOpen(false);
      setDesktopServicesOpen(false);
      setVehiclesOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (vehiclesRef.current && !vehiclesRef.current.contains(target)) {
        setDesktopVehiclesOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(target)) {
        setDesktopServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/80 bg-[#F7F6F2]/92 backdrop-blur-sm">
      <div className="container-site flex h-[4.25rem] items-center justify-between gap-4 md:h-[4.5rem]">
        <BrandLogo variant="header" priority className="max-md:h-8" />

        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 lg:flex xl:gap-7"
        >
          {nav.map((item) => {
            const active = isActive(item.href);

            if (item.kind === "vehicles") {
              return (
                <div key={item.href} className="relative" ref={vehiclesRef}>
                  <button
                    type="button"
                    className={`touch-target relative inline-flex items-center gap-1 text-[14px] font-medium transition-colors ${
                      active
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    aria-expanded={desktopVehiclesOpen}
                    aria-controls={vehiclesMenuId}
                    aria-haspopup="true"
                    onClick={() => {
                      setDesktopVehiclesOpen((v) => !v);
                      setDesktopServicesOpen(false);
                    }}
                  >
                    {item.label}
                    <span aria-hidden className="text-[9px] opacity-60">
                      ▾
                    </span>
                    {active ? (
                      <span className="absolute inset-x-0 -bottom-1 h-px bg-brand-red" />
                    ) : null}
                  </button>
                  {desktopVehiclesOpen ? (
                    <div
                      id={vehiclesMenuId}
                      role="menu"
                      className="absolute left-0 top-full z-50 min-w-48 pt-3"
                    >
                      <div className="border border-border-subtle bg-surface-primary py-2 shadow-editorial">
                        {vehicleLinks.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            role="menuitem"
                            className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                            onClick={() => setDesktopVehiclesOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            }

            if (item.kind === "services") {
              return (
                <div key={item.href} className="relative" ref={servicesRef}>
                  <button
                    type="button"
                    className={`touch-target relative inline-flex items-center gap-1 text-[14px] font-medium transition-colors ${
                      active
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    aria-expanded={desktopServicesOpen}
                    aria-controls={servicesMenuId}
                    aria-haspopup="true"
                    onClick={() => {
                      setDesktopServicesOpen((v) => !v);
                      setDesktopVehiclesOpen(false);
                    }}
                  >
                    {item.label}
                    <span aria-hidden className="text-[9px] opacity-60">
                      ▾
                    </span>
                    {active ? (
                      <span className="absolute inset-x-0 -bottom-1 h-px bg-brand-red" />
                    ) : null}
                  </button>
                  {desktopServicesOpen ? (
                    <div
                      id={servicesMenuId}
                      role="menu"
                      className="absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3"
                    >
                      <div className="border border-border-subtle bg-surface-primary py-2 shadow-editorial">
                        {servicesLinks.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            role="menuitem"
                            className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                            onClick={() => setDesktopServicesOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
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
                className={`touch-target relative inline-flex items-center text-[14px] font-medium transition-colors ${
                  active
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-1 h-px bg-brand-red" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <WhatsAppCta
            message={whatsappMessages.search}
            variant="dark"
            className="hidden sm:inline-flex !min-h-10 !px-4 !text-[13px]"
            aria-label="Contactar por WhatsApp"
          >
            WhatsApp
          </WhatsAppCta>
          <button
            type="button"
            className="touch-target inline-flex items-center justify-center border border-border-subtle px-3 text-sm font-medium text-text-primary lg:hidden"
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
          className="border-t border-border-subtle bg-page-background lg:hidden"
        >
          <ul className="container-site flex flex-col py-3">
            {nav.map((item) => {
              if (item.kind === "vehicles") {
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      className="touch-target flex w-full items-center justify-between py-3.5 text-left text-base font-medium text-text-primary"
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
                    className="touch-target flex items-center py-3.5 text-base font-medium text-text-primary"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="pb-4 pt-3">
              <WhatsAppCta
                message={whatsappMessages.search}
                variant="dark"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                WhatsApp
              </WhatsAppCta>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
