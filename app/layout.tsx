import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import Web3Provider from "@/providers/Web3Provider";

export const metadata: Metadata = {
  title: "Solidarity (SLD) DApp",
  description:
    "Private sale, staking, dashboard & more for the Solidarity token."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
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
