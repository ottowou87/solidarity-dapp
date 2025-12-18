"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

function shorten(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function WalletMenu() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const label = !isConnected ? "Connect Wallet" : shorten(address);

  async function handleMainClick() {
    if (!isConnected) {
      await open();
      return;
    }
    setMenuOpen((v) => !v);
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        onClick={handleMainClick}
        aria-expanded={menuOpen}
        className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600
                   text-black font-semibold shadow-lg hover:brightness-110
                   transition focus:outline-none focus:ring-2 focus:ring-yellow-300/50"
      >
        {label}
      </button>

      {isConnected && menuOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10
                        bg-[#0c0f17]/95 backdrop-blur-xl shadow-2xl
                        overflow-hidden z-50">
          <div className="px-4 py-3 text-xs text-slate-400 border-b border-white/10">
            Connected: {shorten(address)}
          </div>

          <a
            href="https://www.moonpay.com/buy"
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-3 text-sm text-slate-100 hover:bg-white/5"
            onClick={() => setMenuOpen(false)}
          >
            Buy crypto (MoonPay) ↗
          </a>

          <a
            href="https://global.transak.com/"
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-3 text-sm text-slate-100 hover:bg-white/5"
            onClick={() => setMenuOpen(false)}
          >
            Buy crypto (Transak) ↗
          </a>

          <Link
            href="/swap"
            className="block px-4 py-3 text-sm text-slate-100 hover:bg-white/5"
            onClick={() => setMenuOpen(false)}
          >
            Swap (on site)
          </Link>

          <Link
            href="/activity"
            className="block px-4 py-3 text-sm text-slate-100 hover:bg-white/5"
            onClick={() => setMenuOpen(false)}
          >
            Activity (on site)
          </Link>

          <button
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-rose-300
                       hover:bg-white/5 border-t border-white/10"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
