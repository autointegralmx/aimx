import type { ReactNode } from "react";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";

export function PublicShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children?: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      <SiteHeader />
      <main className="container-site section-pad">
        <p className="label-eyebrow">{eyebrow}</p>
        <h1 className="text-h2 mt-2 max-w-[18ch] text-text-primary md:mt-3 md:max-w-none">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text-secondary md:mt-5 md:text-lg">
          {description}
        </p>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
