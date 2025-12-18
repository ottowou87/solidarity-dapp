"use client";

import Link from "next/link";

export default function SwapPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Swap</h1>

      <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40 space-y-3 text-sm">
        <p className="text-slate-300">
          This is your on-site swap page. Next step: embed a swap widget (PancakeSwap / 1inch / custom).
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold"
            href="https://pancakeswap.finance/swap"
            target="_blank"
            rel="noreferrer"
          >
            Open PancakeSwap ↗
          </a>

          <Link
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold"
            href="/account"
          >
            Back to Account
          </Link>
        </div>
      </div>
    </div>
  );
}
