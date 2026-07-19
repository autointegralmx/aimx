import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string | null;
  variant?: "header" | "hero" | "footer";
  className?: string;
  priority?: boolean;
};

const sizes = {
  header: {
    width: 160,
    height: 64,
    className: "h-10 w-auto sm:h-[2.85rem] md:h-12",
  },
  hero: {
    width: 140,
    height: 56,
    className: "h-9 w-auto opacity-100",
  },
  footer: {
    width: 170,
    height: 68,
    className: "h-11 w-auto brightness-0 invert",
  },
};

export function BrandLogo({
  href = "/",
  variant = "header",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const size = sizes[variant];
  const img = (
    <Image
      src="/brand/logo-autointegral-transparent.png"
      alt="Auto Integral"
      width={size.width}
      height={size.height}
      priority={priority}
      className={`${size.className} object-contain object-left ${className}`}
    />
  );

  if (href === null) return img;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center"
      aria-label="Auto Integral — Inicio"
    >
      {img}
    </Link>
  );
}
