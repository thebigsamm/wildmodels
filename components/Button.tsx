import Link from "next/link";
import React from "react";

type Variant = "primary" | "outline" | "subtle";

const base =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff115a]/40 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#ff115a] to-[#c400ff] text-[#060002] shadow-[0_0_26px_rgba(255,17,90,0.5)] hover:opacity-90",
  outline:
    "border border-white/20 bg-transparent text-[#fbecef] hover:bg-white/5",
  subtle:
    "font-semibold text-[#fbecef] hover:text-[#ff5f8f]",
};

export function Button({
  href,
  onClick,
  children,
  variant = "outline",
  className = "",
  disabled = false,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
}) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
