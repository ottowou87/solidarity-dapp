"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  // Landing is DARK to match your HomePage
  const bgClass = isLanding ? "bg-[#050B18] text-white" : "bg-slate-900 text-slate-100";

  return (
    <div className={`${bgClass} min-h-screen flex flex-col`}>
      <Header isLanding={isLanding} />

      <main className={isLanding ? "flex-1 w-full" : "flex-1 w-full max-w-6xl mx-auto px-4 py-10"}>
        {children}
      </main>

      {/* Hide AppShell footer on landing (your landing page already has its own footer) */}
      {!isLanding && (
        <footer className="mt-10 py-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Solidarity (SLD). All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}
