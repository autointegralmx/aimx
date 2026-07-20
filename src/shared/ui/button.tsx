import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  dark: "btn-dark",
  ghost:
    "touch-target inline-flex min-h-11 items-center justify-center px-4 text-[15px] font-medium text-text-secondary hover:text-text-primary disabled:opacity-50",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", className = "", children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);
