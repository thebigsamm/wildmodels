"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./Button";

export function SiteHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    // read ?admin=1 from the real URL
    const sp = new URLSearchParams(window.location.search);
    setShowAdmin(sp.get("admin") === "1");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          WildModels
        </Link>

        <nav className="flex items-center gap-2">
          <Button href="/browse" variant="subtle">
            Browse
          </Button>
          <Button href="/create-profile" variant="subtle">
            Create
          </Button>

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