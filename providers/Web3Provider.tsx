"use client";

import { ReactNode, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defaultWagmiConfig } from "@web3modal/wagmi/react";
import { bsc } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

const metadata = {
  name: "Solidarity DApp",
  description: "SLD Token DApp",
  url: "https://solidarity-dapp.vercel.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

const wagmiConfig = defaultWagmiConfig({
  projectId,
  metadata,
  chains: [bsc]
});

const queryClient = new QueryClient();

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const { createWeb3Modal } = await import("@web3modal/wagmi/react");

      createWeb3Modal({
        wagmiConfig,
        projectId
      });

      setReady(true);
    }

    init();
  }, []);

  if (!ready) return null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
