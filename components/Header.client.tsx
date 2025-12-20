"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useBalance,
  useDisconnect,
  usePublicClient,
} from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { formatGwei, formatUnits } from "viem";

function shortAddr(a?: string) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function formatGasNumber(gwei: number) {
  const raw =
    gwei >= 10 ? gwei.toFixed(0) : gwei >= 1 ? gwei.toFixed(1) : gwei.toFixed(2);
  return raw.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function median(nums: number[]) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default function Header({ isLanding = false }: { isLanding?: boolean }) {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();
  const publicClient = usePublicClient();

  const OWNER_ADDRESS = process.env.NEXT_PUBLIC_OWNER_ADDRESS || "";

  const isOwner = useMemo(() => {
    if (!address || !OWNER_ADDRESS) return false;
    return address.toLowerCase() === OWNER_ADDRESS.toLowerCase();
  }, [address, OWNER_ADDRESS]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { data: bnbBal } = useBalance({
    address,
    query: { enabled: !!address },
  });

  /* ================= GAS ================= */
  const [gasLabel, setGasLabel] = useState<string | null>(null);
  const lastGoodGasRef = useRef<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;

    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function readOnce() {
      const gp = await publicClient!.getGasPrice();
      return Number(formatGwei(gp));
    }

    async function loadGas() {
      try {
        const samples: number[] = [];
        for (let i = 0; i < 3; i++) {
          const v = await readOnce();
          if (Number.isFinite(v) && v > 0) samples.push(v);
          await sleep(120);
        }

        if (!samples.length) throw new Error("No gas");

        const gwei = median(samples);
        const label = gwei < 0.5 ? "< 0.5" : formatGasNumber(gwei);

        if (!alive) return;
        setGasLabel(label);
        lastGoodGasRef.current = label;
      } catch {
        if (!alive) return;
        setGasLabel(lastGoodGasRef.current);
      }
    }

    loadGas();
    const id = setInterval(loadGas, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [publicClient]);

  const buyMoonPayUrl = "https://www.moonpay.com/buy";
  const buyTransakUrl = "https://global.transak.com/";

  const showConnected = mounted && isConnected;

  /* ================= LANDING-ONLY STYLE ================= */
  const headerClass = isLanding
    ? "w-full bg-[#050B18]/55 backdrop-blur-md sticky top-0 z-50"
    : "w-full border-b border-white/10 bg-[#0c0f17]/85 backdrop-blur-lg sticky top-0 z-50";

  const innerPadding = isLanding ? "py-3" : "py-4";

  return (
    <header className={headerClass}>
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between px-6 gap-4 ${innerPadding}`}
      >
        {/* LOGO */}
        <Link href="/" className="text-2xl font-bold text-yellow-400">
          SLD<span className="font-semibold text-white"> Solidarity</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex space-x-8 text-sm text-slate-200">
          <Link href="/dashboard" className="hover:text-yellow-300">
            Dashboard
          </Link>
          <Link href="/private-sale" className="hover:text-yellow-300">
            Private Sale
          </Link>

          {/* BUY (DISABLED) */}
          <span
            className="opacity-50 cursor-not-allowed"
            title="Available after launch"
          >
            Buy (After Launch)
          </span>

          <Link href="/staking" className="hover:text-yellow-300">
            Staking
          </Link>
          <Link href="/claim" className="hover:text-yellow-300">
            Claim
          </Link>
          <Link href="/account" className="hover:text-yellow-300">
            Account
          </Link>

          {/* ADMIN — OWNER ONLY */}
          {isOwner && (
            <Link href="/admin" className="text-yellow-300 font-semibold">
              Admin
            </Link>
          )}
        </nav>

        {/* RIGHT SIDE */}
        <div className="relative flex items-center gap-3" ref={menuRef}>
          {/* GAS */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-white/10 text-xs">
            <span className="text-slate-400">⛽ Gas</span>
            <span className="text-yellow-300 font-semibold">
              {mounted && gasLabel ? `${gasLabel} gwei` : "--"}
            </span>
          </div>

          {/* BNB */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-white/10 text-xs">
            <span className="text-slate-400">🟡 BNB</span>
            <span className="text-yellow-300 font-semibold">
              {showConnected && bnbBal
                ? Number(formatUnits(bnbBal.value, bnbBal.decimals)).toFixed(4)
                : "--"}
            </span>
          </div>

          {/* WALLET BUTTON */}
          <button
            onClick={() => {
              if (!showConnected) return open();
              setMenuOpen((v) => !v);
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold shadow-lg hover:brightness-110 transition"
          >
            {showConnected ? shortAddr(address) : "Connect Wallet"}
          </button>

          {/* WALLET DROPDOWN */}
          {menuOpen && showConnected && (
            <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-[#0c0f17]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 text-xs text-slate-400 border-b border-white/10">
                Wallet Tools
              </div>

              {/* ✅ NAVIGATION SECTION INSIDE DROPDOWN (for mobile users) */}
              <div className="border-b border-white/10 px-4 py-3">
                <div className="text-xs text-slate-400 mb-2">Navigation</div>

                <div className="flex flex-col text-sm">
                  <Link
                    href="/dashboard"
                    className="py-1.5 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/private-sale"
                    className="py-1.5 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Private Sale
                  </Link>

                  <span className="py-1.5 opacity-50 cursor-not-allowed">
                    Buy (After Launch)
                  </span>

                  <Link
                    href="/staking"
                    className="py-1.5 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Staking
                  </Link>

                  <Link
                    href="/claim"
                    className="py-1.5 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Claim
                  </Link>

                  <Link
                    href="/account"
                    className="py-1.5 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>

                  {isOwner && (
                    <Link
                      href="/admin"
                      className="py-1.5 text-yellow-300 font-semibold"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </div>
              {/* ✅ END NAV SECTION */}

              <a
                href={buyMoonPayUrl}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-3 text-sm hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                Buy crypto (MoonPay) ↗
              </a>

              <a
                href={buyTransakUrl}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-3 text-sm hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                Buy crypto (Transak) ↗
              </a>

              <Link
                href="/swap"
                className="block px-4 py-3 text-sm hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                Swap (on site)
              </Link>

              <Link
                href="/activity"
                className="block px-4 py-3 text-sm hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                Activity (on site)
              </Link>

              <button
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-rose-300 hover:bg-white/5 border-t border-white/10"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
