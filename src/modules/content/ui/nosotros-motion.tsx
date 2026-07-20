"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function Reveal({ children, className = "", delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

type AnimatedStatProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

export function AnimatedStat({
  value,
  suffix = "",
  prefix = "",
  label,
}: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        setStarted(true);
        observer.disconnect();

        if (reduced) {
          setDisplay(value);
          return;
        }

        const duration = 1200;
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [started, value]);

  return (
    <div ref={ref} className="min-w-0 text-center sm:text-left">
      <p className="flex flex-wrap items-baseline justify-center gap-x-0.5 text-[clamp(2rem,4.2vw,2.75rem)] font-extrabold leading-none tracking-tight text-text-primary tabular-nums sm:justify-start">
        {prefix ? <span className="text-brand-red">{prefix}</span> : null}
        <span>{display.toLocaleString("es-MX", { useGrouping: false })}</span>
        {suffix ? <span className="text-brand-red">{suffix}</span> : null}
      </p>
      <p className="mt-3 max-w-[12rem] text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] text-text-secondary sm:mx-0 mx-auto">
        {label}
      </p>
    </div>
  );
}
