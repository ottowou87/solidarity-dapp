import type { Metadata } from "next";
import "./globals.css";
import Web3Provider from "@/providers/Web3Provider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Solidarity (SLD) DApp",
  description: "Private sale, staking, dashboard & more for the Solidarity token.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
