import type { ComponentPropsWithoutRef } from "react";
import { buildSiteWhatsAppUrl } from "@/modules/leads/domain/whatsapp";

type Variant = "primary" | "secondary" | "dark" | "onDark";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  dark: "btn-dark",
  onDark: "btn-on-dark",
};

type Props = {
  message: string;
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "children">;

/**
 * Primary conversion CTA — opens WhatsApp directly with a prefilled message.
 * No modal, no form, no intermediate data capture.
 */
export function WhatsAppCta({
  message,
  variant = "primary",
  className = "",
  children = "Quiero más información",
  "aria-label": ariaLabel = "Quiero más información por WhatsApp",
  ...rest
}: Props) {
  const href = buildSiteWhatsAppUrl(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`${variantClass[variant]} min-h-12 ${className}`.trim()}
      {...rest}
    >
      {children}
    </a>
  );
}
