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
        <h1 className="text-h2 mt-3 text-text-primary">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          {description}
        </p>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
