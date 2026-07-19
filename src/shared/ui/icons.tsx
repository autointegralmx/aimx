import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function IconBase({ title, children, className = "", ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-6 w-6 ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconScan(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3H4v3M17 3h3v3M7 21H4v-3M17 21h3v-3M8 8h8v8H8z" />
    </IconBase>
  );
}
export function IconWrench(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18.4V21h2.6l6.7-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z" />
    </IconBase>
  );
}
export function IconSuspension(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12h4l2-4h4l2 4h4M6 16h12M8 16v3M16 16v3" />
    </IconBase>
  );
}
export function IconBrake(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
    </IconBase>
  );
}
export function IconTune(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 8h10M18 8h2M14 6v4M4 16h4M10 16h10M8 14v4" />
    </IconBase>
  );
}
export function IconPaint(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 7-8 8H4v-7zM9 14l1 1" />
    </IconBase>
  );
}
export function IconSparkle(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </IconBase>
  );
}
export function IconPolish(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M8 12c2-3 6-3 8 0" />
    </IconBase>
  );
}
export function IconSeat(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 20V10a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v2h3v8M7 14h7" />
    </IconBase>
  );
}
export function IconHomeService(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" />
    </IconBase>
  );
}
export function IconKey(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="14" r="3" />
      <path d="M10.5 12.5 20 3l2 2-3 3 2 2-2 2-3-3" />
    </IconBase>
  );
}
export function IconChip(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M3 9h4M3 12h4M3 15h4M17 9h4M17 12h4M17 15h4" />
    </IconBase>
  );
}
export function IconSmart(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M11 18h2" />
    </IconBase>
  );
}
export function IconProximity(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM8 14a6 6 0 0 1 8 0M5.5 11a10 10 0 0 1 13 0" />
    </IconBase>
  );
}
export function IconDuplicate(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <path d="M4 16V5a1 1 0 0 1 1-1h11" />
    </IconBase>
  );
}
export function IconUnlock(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
    </IconBase>
  );
}
export function IconImmobilizer(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </IconBase>
  );
}
export function IconReplace(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12a8 8 0 0 1 13.5-5.5M20 4v5h-5M20 12a8 8 0 0 1-13.5 5.5M4 20v-5h5" />
    </IconBase>
  );
}
export function IconInfo(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 10v6M12 7h.01" />
    </IconBase>
  );
}
export function IconWhatsApp(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 11.5A8 8 0 0 1 7.5 18L4 20l2.2-3.4A8 8 0 1 1 20 11.5z" />
      <path d="M9.5 10.5c.5 1.5 2 3 3.5 3.5l1-1.2c.2-.2.5-.3.8-.2l1.5.5c.3.1.5.4.4.7-.3 1.2-1.6 2-2.9 1.7C10.5 14.5 8 12 7.5 8.8c-.2-1.3.6-2.6 1.8-2.9.3-.1.6.1.7.4l.5 1.5c.1.3 0 .6-.2.8z" />
    </IconBase>
  );
}
export function IconShield(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
    </IconBase>
  );
}
export function IconCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 13l4 4L19 7" />
    </IconBase>
  );
}
export function IconMap(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="2" />
    </IconBase>
  );
}
export function IconCar(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 14h16l-1.5-5.5A2 2 0 0 0 16.6 7H7.4a2 2 0 0 0-1.9 1.5L4 14zM6 17h.01M18 17h.01M4 14v3h2M18 17h2v-3" />
    </IconBase>
  );
}
export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}
export function IconMessage(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5h16v11H8l-4 3z" />
    </IconBase>
  );
}
export function IconAdvice(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3a7 7 0 0 1 4 12.7V18H8v-2.3A7 7 0 0 1 12 3zM10 21h4" />
    </IconBase>
  );
}
export function IconCalendar(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="5" width="16" height="16" rx="1" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </IconBase>
  );
}
export function IconDocs(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3h7l4 4v14H7zM14 3v4h4M9 12h6M9 16h6" />
    </IconBase>
  );
}
export function IconDecision(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" />
    </IconBase>
  );
}
export function IconDelivery(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 13h11V7H3zM14 10h4l3 3v3h-7zM6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </IconBase>
  );
}
