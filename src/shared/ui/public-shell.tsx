import type { ReactNode } from "react";
import Image from "next/image";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";

type ShellVariant = "editorial" | "compact" | "image-led";

export function PublicShell({
  children,
  eyebrow,
  title,
  description,
  variant = "editorial",
  imageSrc,
  imageAlt = "",
}: {
  children?: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  variant?: ShellVariant;
  imageSrc?: string;
  imageAlt?: string;
}) {
  const compact = variant === "compact";
  const imageLed = variant === "image-led" && imageSrc;

  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      <SiteHeader />
      <main>
        {imageLed ? (
          <section className="section-light">
            <div className="container-site grid items-end gap-8 py-10 lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:py-14">
              <div>
                <p className="label-eyebrow">{eyebrow}</p>
                <h1 className="text-h2 mt-3 max-w-[18ch] text-text-primary">
                  {title}
                </h1>
                <p className="mt-4 max-w-xl text-body-editorial text-text-secondary">
                  {description}
                </p>
              </div>
              <div className="relative aspect-[5/4] overflow-hidden bg-surface-secondary">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </section>
        ) : (
          <section
            className={
              compact
                ? "container-site pt-8 pb-2 md:pt-12"
                : "container-site pt-10 pb-2 md:pt-16"
            }
          >
            <p className="label-eyebrow">{eyebrow}</p>
            <h1
              className={`mt-3 max-w-[20ch] text-text-primary ${
                compact ? "text-h3 md:text-h2" : "text-h2"
              }`}
            >
              {title}
            </h1>
            <p
              className={`mt-3 max-w-2xl text-text-secondary ${
                compact
                  ? "text-[15px] leading-relaxed md:text-base"
                  : "text-body-editorial"
              }`}
            >
              {description}
            </p>
          </section>
        )}
        <div
          className={
            compact
              ? "container-site pb-12 pt-6 md:pb-16"
              : "container-site pb-16 pt-6 md:pb-24 md:pt-8"
          }
        >
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
