"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { WagmiProvider } from "wagmi";
import { bsc } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

const metadata = {
  name: "Solidarity DApp",
  description: "SLD Token DApp",
  url: "https://solidarity-dapp.vercel.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// ✅ REQUIRED tuple
const chains = [bsc] as const;

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

const queryClient = new QueryClient();

/**
 * ✅ CRITICAL FIX
 * - Runs before any hook
 * - Runs only in browser
 * - Prevents indexedDB crash
 */
if (typeof window !== "undefined") {
  createWeb3Modal({
    wagmiConfig,
    projectId,
  });
}

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
