"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type Tx = {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
};

export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (!address) return;
        const apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY;
        if (!apiKey) return;

        setLoading(true);
        const r = await fetch(
          `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}`
        );
        const j = await r.json();
        if (Array.isArray(j?.result)) setTxs(j.result);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Activity</h1>

      {!process.env.NEXT_PUBLIC_BSCSCAN_API_KEY && (
        <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900/40 text-sm text-slate-300">
          Add <code className="text-yellow-300">NEXT_PUBLIC_BSCSCAN_API_KEY</code> in Vercel/.env.local to enable activity.
        </div>
      )}

      <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
        {!isConnected ? (
          <p className="text-slate-400 text-sm">Connect wallet to see activity.</p>
        ) : loading ? (
          <p className="text-slate-400 text-sm">Loading recent transactions...</p>
        ) : txs.length === 0 ? (
          <p className="text-slate-400 text-sm">No transactions found (or API not enabled).</p>
        ) : (
          <div className="space-y-3">
            {txs.map((t) => (
              <a
                key={t.hash}
                href={`https://bscscan.com/tx/${t.hash}`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-white/5 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 break-all">{t.hash}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(Number(t.timeStamp) * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-300">
                  From {t.from.slice(0, 8)}… to {t.to.slice(0, 8)}…
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
