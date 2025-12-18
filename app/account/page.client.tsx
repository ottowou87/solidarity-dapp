"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatGwei, formatUnits } from "viem";
import { tokenContract, stakingContract } from "@/lib/contracts";
import dynamic from "next/dynamic";

const TradingView = dynamic<{ symbol: string }>(
  () => import("@/components/TradingViewMiniChart"),
  { ssr: false }
);

type WhaleAlert = {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
};

function formatGasLabel(gwei: number) {
  const raw =
    gwei >= 10 ? gwei.toFixed(0) : gwei >= 1 ? gwei.toFixed(1) : gwei.toFixed(2);
  return raw.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function median(nums: number[]) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, status, chain } = useAccount();
  const publicClient = usePublicClient();

  const cardClass =
    "border border-slate-800 rounded-2xl p-6 bg-[#0f172a] shadow-lg shadow-black/30";
  const subtleTextClass = "text-slate-400";

  // Copy + explorer
  const [copied, setCopied] = useState(false);

  const explorerBase = useMemo(() => {
    if (chain?.id === 97) return "https://testnet.bscscan.com";
    return "https://bscscan.com";
  }, [chain?.id]);

  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }, [address]);

  // Balances
  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const { data: sldRaw } = useReadContract({
    ...tokenContract,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const bnb = nativeBalance
  ? Number(formatUnits(nativeBalance.value, nativeBalance.decimals))
  : 0;

  const sld = sldRaw ? Number(formatUnits(sldRaw as bigint, 18)) : 0;

  const totalTokens = bnb + sld;
  const bnbShare = totalTokens > 0 ? (bnb / totalTokens) * 100 : 0;
  const sldShare = totalTokens > 0 ? (sld / totalTokens) * 100 : 0;

  // Live prices
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);
  const [bnbChange24h, setBnbChange24h] = useState<number | null>(null);
  const [bnbVolume24h, setBnbVolume24h] = useState<number | null>(null);

  const [sldPrice, setSldPrice] = useState<number | null>(null); // awaiting listing
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [activeChart, setActiveChart] = useState<"BNB" | "SLD">("BNB");

  const loadPrices = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const res = await fetch(
        "https://api.dexscreener.com/latest/dex/pairs/bsc/0x1fc59e55988c21c46a58fce33fbd293c15aa6f63"
      );
      const json = await res.json();
      const pair = json?.pair;

      if (pair?.priceUsd) setBnbPrice(Number(pair.priceUsd));
      else setBnbPrice(null);

      const pct =
        (pair?.priceChange && (pair.priceChange.h24 as unknown)) ??
        (pair?.priceChange24h as unknown);

      setBnbChange24h(
        typeof pct === "string" || typeof pct === "number" ? Number(pct) : null
      );

      const vol =
        (pair?.volume && (pair.volume.h24 as unknown)) ?? (pair?.volume24h as unknown);

      setBnbVolume24h(
        typeof vol === "string" || typeof vol === "number" ? Number(vol) : null
      );

      setSldPrice(null); // not listed yet
      setLastUpdatedLabel(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn("Price fetch error", e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => loadPrices(), 60_000);
    return () => clearInterval(id);
  }, [autoRefresh, loadPrices]);

  const totalUsd = bnb * (bnbPrice ?? 0) + sld * (sldPrice ?? 0);

  // ✅ Real Gas (median-of-3 samples, avoid "0.1 gwei" glitch)
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

    async function fetchGas() {
      try {
        const samples: number[] = [];
        for (let i = 0; i < 3; i++) {
          const v = await readOnce();
          if (Number.isFinite(v) && v > 0) samples.push(v);
          await sleep(120);
        }

        if (!samples.length) throw new Error("No valid gas samples");

        const gwei = median(samples);
        const label = gwei < 0.5 ? "< 0.5" : formatGasLabel(gwei);

        if (!alive) return;
        setGasLabel(label);
        lastGoodGasRef.current = label;
      } catch {
        if (!alive) return;
        setGasLabel(lastGoodGasRef.current);
      }
    }

    fetchGas();
    const id = setInterval(fetchGas, 30_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [publicClient]);

  // Staking ROI (pool 0)
  const { data: stakingInfo } = useReadContract({
    ...stakingContract,
    functionName: "getUserInfo",
    args: address ? [address, 0] : undefined,
  });

  const stakedAmount =
    stakingInfo && Array.isArray(stakingInfo)
      ? Number(formatUnits(stakingInfo[0] as bigint, 18))
      : 0;

  const rateBps =
    stakingInfo && Array.isArray(stakingInfo) ? Number(stakingInfo[2]) : 0;

  const aprPercent = rateBps ? (rateBps / 10000) * 100 : 0;
  const dailyRoi = aprPercent / 365;
  const weeklyRoi = aprPercent / 52;
  const monthlyRoi = aprPercent / 12;
  const yearlyRoi = aprPercent;

  const breakEvenDays = aprPercent > 0 ? (100 / aprPercent) * 365 : null;

  const projected1yBalance =
    stakedAmount > 0 && aprPercent > 0
      ? stakedAmount * Math.pow(1 + aprPercent / 100 / 12, 12)
      : 0;

  const projected1yRewards =
    projected1yBalance > 0 ? projected1yBalance - stakedAmount : 0;

  // Allowance manager
  const { data: stakingAllowance } = useReadContract({
    ...(tokenContract as Record<string, unknown>),
    functionName: "allowance",
    args: address
      ? [address, stakingContract.address as `0x${string}`]
      : undefined,
  });

  const allowanceSLD =
    stakingAllowance !== undefined
      ? Number(formatUnits(stakingAllowance as bigint, 18))
      : 0;

  const {
    writeContract: writeToken,
    data: revokeHash,
    isPending: isRevoking,
  } = useWriteContract();

  const { isLoading: isRevokeConfirming, isSuccess: revokeSuccess } =
    useWaitForTransactionReceipt({ hash: revokeHash });

  const revoking = isRevoking || isRevokeConfirming;

  const handleRevoke = () => {
    if (!address) return;
    writeToken({
      ...tokenContract,
      functionName: "approve",
      args: [stakingContract.address as `0x${string}`, BigInt(0)],
    });
  };

  // Whale alerts (needs public API key)
  const [whaleEnabled, setWhaleEnabled] = useState(false);
  const [whaleThreshold, setWhaleThreshold] = useState("1000000");
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
  const [whaleStatus, setWhaleStatus] = useState<string | null>(null);
  const lastWhaleHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (!whaleEnabled) return;

    const apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY;
    if (!apiKey) {
      setWhaleStatus("Add NEXT_PUBLIC_BSCSCAN_API_KEY to enable whale alerts.");
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${tokenContract.address}&sort=desc&page=1&offset=20&apikey=${apiKey}`;
        const res = await fetch(url);
        const json = await res.json();
        const txs = json?.result;

        if (!Array.isArray(txs) || txs.length === 0) return;

        const threshold = Number(whaleThreshold.replace(/_/g, "")) || 0;

        if (!lastWhaleHashRef.current) {
          lastWhaleHashRef.current = txs[0].hash;
          return;
        }

        const newAlerts: WhaleAlert[] = [];

        for (const tx of txs) {
          if (tx.hash === lastWhaleHashRef.current) break;

          const amount = Number(tx.value) / 1e18;
          if (amount >= threshold) {
            newAlerts.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              amount,
              timestamp: Number(tx.timeStamp),
            });
          }
        }

        if (newAlerts.length && !cancelled) {
          lastWhaleHashRef.current = newAlerts[0].hash;
          setWhaleAlerts((prev) => [...newAlerts, ...prev].slice(0, 6));
          setWhaleStatus(
            `Last alert: ${new Date(
              newAlerts[0].timestamp * 1000
            ).toLocaleTimeString()}`
          );
        }
      } catch (e) {
        if (!cancelled) {
          setWhaleStatus("Error while fetching whale data.");
          console.warn("Whale alert error", e);
        }
      }
    }

    poll();
    const id = setInterval(poll, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [whaleEnabled, whaleThreshold]);

  // Health score
  const numericGas = (() => {
    if (!gasLabel) return null;
    if (gasLabel.startsWith("<")) return 0.49; // still lets health logic run
    const n = Number(gasLabel);
    return Number.isFinite(n) ? n : null;
  })();

  let healthScore = 60;
  if (stakedAmount > 0) healthScore += 15;
  if (aprPercent > 0) healthScore += 5;

  if (numericGas !== null) {
    if (numericGas < 8) healthScore += 5;
    if (numericGas > 20) healthScore -= 5;
  }

  if (allowanceSLD > 1_000_000) healthScore -= 20;
  if (whaleEnabled) healthScore += 5;

  healthScore = Math.max(0, Math.min(100, healthScore));

  let healthLabel = "Moderate";
  let healthColorClass = "text-amber-400";

  if (healthScore >= 85) {
    healthLabel = "Excellent";
    healthColorClass = "text-emerald-400";
  } else if (healthScore >= 65) {
    healthLabel = "Good";
    healthColorClass = "text-green-400";
  } else if (healthScore <= 40) {
    healthLabel = "High risk";
    healthColorClass = "text-rose-400";
  }

  let healthInsight = "Balanced wallet. Keep monitoring staking and gas fees.";
  if (stakedAmount === 0 && sld > 0) {
    healthInsight =
      "You hold SLD but are not staking yet. Consider staking a portion to earn yield.";
  } else if (allowanceSLD > 1_000_000) {
    healthInsight =
      "Your staking allowance is very high. For extra safety, you can reduce or revoke approval.";
  } else if (numericGas !== null && numericGas > 25) {
    healthInsight =
      "Gas is currently elevated. If possible, execute non-urgent actions later for better fees.";
  } else if (stakedAmount > 0 && aprPercent > 0) {
    healthInsight =
      "Your SLD is working for you via staking. Monitor APR and compounding period for optimal results.";
  }

  if (!mounted) {
    return <div className="text-slate-400">Loading account...</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Account</h1>
      </div>

      <div className={cardClass}>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Connection:</span>{" "}
            {status === "connected" ? "Connected" : "Not connected"}
          </div>

          <div className="break-all flex flex-wrap items-center gap-2">
            <span className="font-semibold">Wallet:</span> {address || "--"}

            {address && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>

                <a
                  href={`${explorerBase}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Open on BscScan ↗
                </a>
              </>
            )}
          </div>

          <div>
            <span className="font-semibold">Network:</span> {chain?.name || "--"}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h2 className="text-lg font-semibold">Portfolio Value</h2>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>BNB</span>
              <span>
                {bnb.toFixed(4)} · ${(bnb * (bnbPrice ?? 0)).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>SLD</span>
              <span>
                {sld.toLocaleString()} · ${(sld * (sldPrice ?? 0)).toFixed(2)}
              </span>
            </div>

            <div className="border-t border-slate-700/50 pt-2 font-semibold">
              Total: ${totalUsd.toFixed(2)}
            </div>

            <div className="mt-3">
              <div className={`${subtleTextClass} text-xs mb-1`}>
                Portfolio distribution
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${Math.max(2, Math.min(98, bnbShare))}%`,
                  }}
                />
              </div>
              <div
                className={`${subtleTextClass} text-xs mt-1 flex justify-between`}
              >
                <span>BNB {bnbShare.toFixed(1)}%</span>
                <span>SLD {sldShare.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-semibold">Gas &amp; Network</h2>

          <div className="mt-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Gas Price:</span>
              <span>{gasLabel ? `${gasLabel} gwei` : "--"}</span>
            </div>

            {!process.env.NEXT_PUBLIC_BSCSCAN_API_KEY && (
              <p className={`text-xs ${subtleTextClass}`}>
                Whale alerts require <code>NEXT_PUBLIC_BSCSCAN_API_KEY</code>.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold">Live Market Prices</h2>

          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <label className="flex items-center gap-1">
              <span className={subtleTextClass}>Auto refresh</span>
              <button
                type="button"
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition ${
                  autoRefresh ? "bg-emerald-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white transform transition ${
                    autoRefresh ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>

            <button
              type="button"
              onClick={loadPrices}
              className="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-semibold text-xs md:text-sm disabled:opacity-60 hover:bg-cyan-300"
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh prices"}
            </button>

            <span className={subtleTextClass}>
              {lastUpdatedLabel ? `Last update: ${lastUpdatedLabel}` : "Fetching prices..."}
            </span>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>BNB price</span>
              <span>{bnbPrice ? `$${bnbPrice.toFixed(2)}` : "--"}</span>
            </div>
            <div className="flex justify-between">
              <span>24h Change</span>
              <span
                className={
                  bnbChange24h !== null
                    ? bnbChange24h >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                    : ""
                }
              >
                {bnbChange24h !== null ? `${bnbChange24h.toFixed(2)}%` : "--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>24h Volume</span>
              <span>
                {bnbVolume24h !== null ? `$${bnbVolume24h.toLocaleString()}` : "--"}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>SLD price</span>
              <span>{sldPrice !== null ? `$${sldPrice}` : "-- awaiting listing"}</span>
            </div>
            <div className="flex justify-between">
              <span>24h Change</span>
              <span>--</span>
            </div>
            <div className="flex justify-between">
              <span>24h Volume</span>
              <span>--</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setActiveChart("BNB")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                activeChart === "BNB"
                  ? "bg-cyan-400 text-black"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              BNB Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveChart("SLD")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                activeChart === "SLD"
                  ? "bg-cyan-400 text-black"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              SLD Chart
            </button>
          </div>

          <div className="h-64 w-full">
            {activeChart === "BNB" ? (
              <TradingView symbol="BINANCE:BNBUSDT" />
            ) : (
              <TradingView symbol="BINANCE:BNBUSDT" />
            )}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Wallet Health & Smart Insights</h2>
            <p className={`text-xs mt-1 ${subtleTextClass}`}>
              Based on staking, gas fees, contract approvals and whale monitoring. Informational only — not financial advice.
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-400">Health score</div>
            <div className={`text-2xl font-bold ${healthColorClass}`}>{healthScore}/100</div>
            <div className={`text-xs ${subtleTextClass}`}>{healthLabel}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full ${
                healthScore >= 80
                  ? "bg-emerald-500"
                  : healthScore >= 60
                  ? "bg-yellow-400"
                  : healthScore >= 40
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className={subtleTextClass}>Staking</div>
            <div className="font-semibold">
              {stakedAmount > 0
                ? `${stakedAmount.toLocaleString()} SLD staked`
                : "No SLD currently staked"}
            </div>
          </div>
          <div>
            <div className={subtleTextClass}>Gas environment</div>
            <div className="font-semibold">
              {gasLabel ? `${gasLabel} gwei (BSC)` : "Gas data not available"}
            </div>
          </div>
          <div>
            <div className={subtleTextClass}>Staking allowance</div>
            <div className="font-semibold">
              {allowanceSLD.toLocaleString(undefined, { maximumFractionDigits: 2 })} SLD
            </div>
          </div>
        </div>

        <p className={`mt-3 text-sm ${subtleTextClass}`}>{healthInsight}</p>
      </div>

      {/* ROI + Whale Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h2 className="text-lg font-semibold">Staking ROI Insights (Pool 0)</h2>

          {address && stakedAmount > 0 && aprPercent > 0 ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className={`${subtleTextClass} text-xs uppercase tracking-wide`}>
                Current APR
              </div>
              <div className="text-2xl font-bold">{aprPercent.toFixed(2)}%</div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <div className={subtleTextClass}>Daily ROI</div>
                  <div>{dailyRoi.toFixed(3)}%</div>
                </div>
                <div>
                  <div className={subtleTextClass}>Weekly ROI</div>
                  <div>{weeklyRoi.toFixed(2)}%</div>
                </div>
                <div>
                  <div className={subtleTextClass}>Monthly ROI</div>
                  <div>{monthlyRoi.toFixed(2)}%</div>
                </div>
                <div>
                  <div className={subtleTextClass}>Yearly ROI</div>
                  <div>{yearlyRoi.toFixed(2)}%</div>
                </div>
              </div>

              <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className={subtleTextClass}>Staked in pool 0</div>
                  <div>{stakedAmount.toLocaleString()} SLD</div>
                </div>
                <div>
                  <div className={subtleTextClass}>1-year projection</div>
                  <div>
                    {projected1yBalance.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    SLD
                  </div>
                  <div className="text-xs text-emerald-400">
                    +{" "}
                    {projected1yRewards.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    SLD
                  </div>
                </div>
              </div>

              {breakEvenDays && (
                <p className={`mt-2 text-xs ${subtleTextClass}`}>
                  Approx. break-even (100% ROI) in {breakEvenDays.toFixed(0)} days if
                  APR stays constant.
                </p>
              )}
            </div>
          ) : (
            <p className={`mt-3 text-sm ${subtleTextClass}`}>
              Stake SLD in pool 0 to unlock ROI insights.
            </p>
          )}
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Whale Alerts (beta)</h2>
            <button
              type="button"
              onClick={() => setWhaleEnabled((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                whaleEnabled
                  ? "bg-emerald-500 text-black"
                  : "bg-slate-700 text-slate-100"
              }`}
            >
              {whaleEnabled ? "Enabled 🐋" : "Disabled"}
            </button>
          </div>

          <div className="mt-3 text-sm space-y-2">
            <label className="flex flex-col gap-1">
              <span className={subtleTextClass}>Minimum transfer to alert (SLD)</span>
              <input
                type="number"
                min={0}
                value={whaleThreshold}
                onChange={(e) => setWhaleThreshold(e.target.value)}
                className="w-full rounded-lg bg-slate-950/40 border border-slate-700 px-3 py-1.5 text-sm"
              />
            </label>

            <p className={`text-xs ${subtleTextClass}`}>
              Uses BscScan token transfers for the official SLD contract. Alerts will show
              very large transfers only.
            </p>

            {whaleStatus && <p className={`text-xs ${subtleTextClass}`}>{whaleStatus}</p>}

            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-950/40 border border-slate-800 text-xs">
              {whaleAlerts.length === 0 ? (
                <div className="px-3 py-2 text-slate-500">No whale events detected yet.</div>
              ) : (
                whaleAlerts.map((alert) => (
                  <div
                    key={alert.hash}
                    className="px-3 py-2 border-b border-slate-800 last:border-none"
                  >
                    <div className="flex justify-between">
                      <span>
                        {alert.amount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        SLD
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {alert.from.slice(0, 6)}… → {alert.to.slice(0, 6)}…
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Manager */}
      <div className={cardClass}>
        <h2 className="text-xl font-semibold">Token Approval Manager</h2>

        <p className={`text-sm mt-1 ${subtleTextClass}`}>
          View and revoke allowances for key SLD contracts.
        </p>

        <div className="mt-4 text-sm space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className={subtleTextClass}>Staking contract</div>
              <div className="font-mono text-xs break-all">{stakingContract.address}</div>
            </div>
            <div className="text-right">
              <div className={subtleTextClass}>Allowance</div>
              <div>{allowanceSLD.toFixed(4)} SLD</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRevoke}
            disabled={!address || allowanceSLD === 0 || revoking}
            className="mt-3 px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {revoking ? "Revoking…" : "Revoke allowance"}
          </button>

          {revokeSuccess && (
            <p className="text-xs text-emerald-400 mt-1">
              Allowance revoked. You may need to refresh to see the updated value.
            </p>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <p className={`text-sm mt-1 ${subtleTextClass}`}>
          You can enhance this section using the BscScan API (account &amp; txlist) to show
          your latest SLD &amp; BNB movements.
        </p>
      </div>
    </div>
  );
}
