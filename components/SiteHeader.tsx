"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./Button";
import HeaderAuthNav from "@/components/HeaderAuthNav";

export function SiteHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    // read ?admin=1 from the real URL
    const sp = new URLSearchParams(window.location.search);
    setShowAdmin(sp.get("admin") === "1");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#060002]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="bg-gradient-to-r from-[#ff115a] to-[#c400ff] bg-clip-text font-[family-name:var(--font-display)] text-2xl tracking-wide text-transparent"
        >
          WILDMODELS
        </Link>

        <nav className="flex items-center gap-2">
          <HeaderAuthNav />

          {rightSlot ? (
            rightSlot
          ) : showAdmin ? (
            <Button href="/admin" variant="outline" className="ml-1">
              Admin
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}