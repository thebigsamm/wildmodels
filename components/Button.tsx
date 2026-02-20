import Link from "next/link";
import React from "react";

type Variant = "primary" | "outline" | "subtle";

const base =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-black/90 shadow-sm",
  outline:
    "border border-black/15 bg-white text-black hover:bg-gray-50 shadow-sm",
  subtle:
    "text-black/80 hover:text-black hover:bg-gray-50",
};

export function Button({
  href,
  onClick,
  children,
  variant = "outline",
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
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
    <button className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
