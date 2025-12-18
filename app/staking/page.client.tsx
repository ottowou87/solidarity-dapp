"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { stakingContract, tokenContract } from "@/lib/contracts";

type PoolId = 0 | 1 | 2;

type TxMode =
  | null
  | "approve"
  | "stake"
  | "unstake"
  | "claim"
  | "exit"
  | "compound_claim"
  | "compound_approve"
  | "compound_stake";

function secondsToParts(s: number) {
  const sec = Math.max(0, Math.floor(s));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  return { d, h, m, s: ss };
}

function fmtNum(n: number, max = 6) {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: max });
}

export default function StakingPage() {
  const { address, isConnected } = useAccount();

  const [poolId, setPoolId] = useState<PoolId>(0);
  const [amount, setAmount] = useState("");

  // UI config for pools (locks are UI + event-derived countdown)
  const pools = useMemo(
    () => [
      { id: 0 as PoolId, title: "Pool 0", desc: "Flexible staking. No lock.", lockDays: 0 },
      { id: 1 as PoolId, title: "Pool 1", desc: "Higher yield. 90-day lock.", lockDays: 90 },
      { id: 2 as PoolId, title: "Pool 2", desc: "Highest yield. 180-day lock.", lockDays: 180 },
    ],
    []
  );

  const activePool = pools.find((p) => p.id === poolId)!;

  const card =
    "border border-slate-700/70 bg-slate-900/40 rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/20";
  const subtle = "text-slate-400";

  // ---------------------- READS ----------------------
  const userInfoQuery = useReadContract({
    ...stakingContract,
    functionName: "getUserInfo",
    args: isConnected && address ? [address, poolId] : undefined,
    query: { enabled: !!(isConnected && address) },
  });

  const stakedRaw = userInfoQuery.data?.[0] as bigint | undefined;
  const pendingRaw = userInfoQuery.data?.[1] as bigint | undefined;
  const rateBps = userInfoQuery.data?.[2] ? Number(userInfoQuery.data?.[2]) : 0;

  const staked = stakedRaw ? Number(formatUnits(stakedRaw, 18)) : 0;
  const pending = pendingRaw ? Number(formatUnits(pendingRaw, 18)) : 0;
  const aprPercent = ((rateBps / 10000) * 100).toFixed(2);

  // token balance for MAX (user wallet balance)
  const tokenBalQuery = useReadContract({
    ...tokenContract,
    functionName: "balanceOf",
    args: isConnected && address ? [address] : undefined,
    query: { enabled: !!(isConnected && address) },
  });

  const tokenBal = tokenBalQuery.data
    ? Number(formatUnits(tokenBalQuery.data as bigint, 18))
    : 0;

  // allowance
  const allowanceQuery = useReadContract({
  ...(tokenContract as unknown as {
    address: `0x${string}`;
    abi: readonly unknown[];
  }),
  functionName: "allowance",
  args: isConnected && address
    ? [address, stakingContract.address as `0x${string}`]
    : undefined,
  query: { enabled: !!(isConnected && address) },
});

  const allowance = allowanceQuery.data ? (allowanceQuery.data as bigint) : BigInt(0);

  const parsedAmount = useMemo(() => {
    try {
      if (!amount) return BigInt(0);
      const clean = amount.replace(/,/g, "").trim();
      if (!clean) return BigInt(0);
      return parseUnits(clean, 18);
    } catch {
      return BigInt(0);
    }
  }, [amount]);

  const hasAllowance =
  parsedAmount > BigInt(0) ? allowance >= parsedAmount : false;

  // Pool TVL (simple: token balance held by staking contract)
  // If your contract holds the staked tokens, this shows a real TVL-like value.
  const tvlQuery = useReadContract({
    ...tokenContract,
    functionName: "balanceOf",
    args: [stakingContract.address as `0x${string}`],
    query: { enabled: true },
  });

  const tvl = tvlQuery.data ? Number(formatUnits(tvlQuery.data as bigint, 18)) : 0;

  // ---------------------- WRITES ----------------------
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const busy = isPending || receipt.isLoading;

  const [txMode, setTxMode] = useState<TxMode>(null);
  const compoundAmountRef = useRef<bigint>(BigInt(0));

  const refetchAll = useCallback(() => {
    userInfoQuery.refetch?.();
    allowanceQuery.refetch?.();
    tokenBalQuery.refetch?.();
    tvlQuery.refetch?.();
  }, [userInfoQuery, allowanceQuery, tokenBalQuery, tvlQuery]);

  // auto-refresh after tx success
  useEffect(() => {
    if (receipt.isSuccess) {
      refetchAll();
      setTxMode(null);
    }
  }, [receipt.isSuccess, refetchAll]);

  // ---------------------- ACTIONS ----------------------
  const doApprove = useCallback(() => {
    if (!isConnected || !address || parsedAmount <= BigInt(0)) return;
    setTxMode("approve");
    writeContract({
      ...tokenContract,
      functionName: "approve",
      args: [stakingContract.address as `0x${string}`, parsedAmount],
    });
  }, [isConnected, address, parsedAmount, writeContract]);

  const doStake = useCallback(() => {
    if (!isConnected || !address || parsedAmount <= BigInt(0) || !hasAllowance) return;
    setTxMode("stake");
    writeContract({
      ...stakingContract,
      functionName: "stake",
      args: [poolId, parsedAmount],
    });
  }, [isConnected, address, parsedAmount, hasAllowance, poolId, writeContract]);

  const doUnstake = useCallback(() => {
    if (!isConnected || !address || parsedAmount <= BigInt(0)) return;
    setTxMode("unstake");
    writeContract({
      ...stakingContract,
      functionName: "unstake",
      args: [poolId, parsedAmount],
    });
  }, [isConnected, address, parsedAmount, poolId, writeContract]);

  const doClaim = useCallback(() => {
    if (!isConnected || !address) return;
    setTxMode("claim");
    writeContract({
      ...stakingContract,
      functionName: "claim",
      args: [poolId],
    });
  }, [isConnected, address, poolId, writeContract]);

  const doExit = useCallback(() => {
    if (!isConnected || !address) return;
    setTxMode("exit");
    writeContract({
      ...stakingContract,
      functionName: "exit",
      args: [poolId],
    });
  }, [isConnected, address, poolId, writeContract]);

  // Compound = claim → (approve if needed) → stake(pending)
  const doCompound = useCallback(() => {
    if (!isConnected || !address) return;
    if (!pendingRaw || pendingRaw <= BigInt(0)) return;

    compoundAmountRef.current = pendingRaw;
    setTxMode("compound_claim");

    writeContract({
      ...stakingContract,
      functionName: "claim",
      args: [poolId],
    });
  }, [isConnected, address, pendingRaw, poolId, writeContract]);

  // chain compound steps after receipt
  useEffect(() => {
    if (!receipt.isSuccess) return;
    if (!txMode) return;

    if (txMode === "compound_claim") {
      const need = compoundAmountRef.current;
      if (need <= BigInt(0)) return;

      const ok = allowance >= need;
      if (ok) {
        setTxMode("compound_stake");
        writeContract({
          ...stakingContract,
          functionName: "stake",
          args: [poolId, need],
        });
      } else {
        setTxMode("compound_approve");
        writeContract({
          ...tokenContract,
          functionName: "approve",
          args: [stakingContract.address as `0x${string}`, need],
        });
      }
    } else if (txMode === "compound_approve") {
      const need = compoundAmountRef.current;
      if (need <= BigInt(0)) return;
      setTxMode("compound_stake");
      writeContract({
        ...stakingContract,
        functionName: "stake",
        args: [poolId, need],
      });
    }
  }, [receipt.isSuccess, txMode, allowance, poolId, writeContract]);

  // ---------------------- MAX BUTTON ----------------------
  const onMax = () => setAmount(tokenBal > 0 ? tokenBal.toString() : "");

  // ---------------------- LOCK COUNTDOWN (server logs) ----------------------
  const [lastStakeTs, setLastStakeTs] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [lockLoading, setLockLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Exact keccak topic0 for Staked(address,uint8,uint256):
  // 0x3cf14181ae25669a913d72411736fc5c01f538fa503e963b0b2e56bcefb3edaf
  useEffect(() => {
    if (!isConnected || !address) {
      setLastStakeTs(null);
      return;
    }

    let cancelled = false;

    async function loadLastStake() {
      setLockLoading(true);
      try {
        const r = await fetch(`/api/last-stake?poolId=${poolId}&user=${address}`, {
          cache: "no-store",
        });
        const j = await r.json();
        const ts = typeof j?.timeStamp === "number" ? j.timeStamp : null;
        if (!cancelled) setLastStakeTs(ts && ts > 0 ? ts : null);
      } catch {
        if (!cancelled) setLastStakeTs(null);
      } finally {
        if (!cancelled) setLockLoading(false);
      }
    }

    loadLastStake();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address, poolId]);

  const unlockTs = useMemo(() => {
    if (!lastStakeTs) return null;
    if (activePool.lockDays <= 0) return null;
    return lastStakeTs + activePool.lockDays * 86400;
  }, [lastStakeTs, activePool.lockDays]);

  const remaining = unlockTs ? unlockTs - now : null;
  const locked = remaining !== null && remaining > 0;

  // ---------------------- APR HISTORY (server logs) ----------------------
  const [aprPoints, setAprPoints] = useState<{ timeStamp: number; apr: number }[]>([]);
  const [aprLoading, setAprLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAprHistory() {
      setAprLoading(true);
      try {
        const r = await fetch(
          `/api/apr-history?poolId=${poolId}&address=${stakingContract.address}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        const pts = Array.isArray(j?.points)
  ? j.points.map((p: unknown) => {
      const point = p as { timeStamp?: unknown; apr?: unknown };

      return {
        timeStamp: Number(point.timeStamp ?? 0),
        apr: Number(point.apr ?? 0),
      };
    })
  : [];

        if (!cancelled) setAprPoints(pts);
      } catch {
        if (!cancelled) setAprPoints([]);
      } finally {
        if (!cancelled) setAprLoading(false);
      }
    }

    loadAprHistory();
    return () => {
      cancelled = true;
    };
  }, [poolId]);

  const aprChart = useMemo(() => {
    if (!aprPoints.length) return null;
    const pts = aprPoints.slice(-30);
    const ys = pts.map((p) => p.apr);

    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const range = Math.max(1e-6, maxY - minY);

    const w = 900;
    const h = 160;
    const pad = 10;

    const toX = (i: number) => pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
    const toY = (v: number) => pad + (1 - (v - minY) / range) * (h - pad * 2);

    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.apr).toFixed(1)}`)
      .join(" ");

    return { d };
  }, [aprPoints]);

  // ---------------------- UX EDGE CASES ----------------------
  const actionDisabledBecauseLock =
    activePool.lockDays > 0 && locked; // only affects withdraw/exit

  const lockReason = actionDisabledBecauseLock
    ? `Locked until ${unlockTs ? new Date(unlockTs * 1000).toLocaleString() : "unlock"}`
    : "";
const receiptError =
  (receipt as unknown as { error?: Record<string, unknown> }).error;

const errorMsg: string | null | undefined =
  typeof (writeError as unknown as { shortMessage?: unknown })?.shortMessage === "string"
    ? (writeError as unknown as { shortMessage?: string }).shortMessage
    : typeof (writeError as unknown as { message?: unknown })?.message === "string"
    ? (writeError as unknown as { message?: string }).message
    : receiptError &&
      typeof receiptError === "object" &&
      "shortMessage" in receiptError &&
      typeof (receiptError as { shortMessage?: unknown }).shortMessage === "string"
    ? (receiptError as { shortMessage: string }).shortMessage
    : receiptError &&
      typeof receiptError === "object" &&
      "message" in receiptError &&
      typeof (receiptError as { message?: unknown }).message === "string"
    ? (receiptError as { message: string }).message
    : null;

  // ---------------------- UI ----------------------
  return (
    <div className="space-y-10 pb-20">
      <h1 className="text-3xl sm:text-4xl font-bold">Staking</h1>

      {/* Pools: horizontal scroll on mobile, 3 columns on md+ */}
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="flex gap-4 overflow-x-auto pb-2 md:contents">
          {pools.map((p) => (
            <button
              key={p.id}
              onClick={() => setPoolId(p.id)}
              className={`min-w-[260px] md:min-w-0 text-left rounded-2xl p-5 sm:p-6 border transition md:w-auto ${
                poolId === p.id
                  ? "border-yellow-400 bg-slate-900/60"
                  : "border-slate-700 bg-slate-900/30 hover:border-slate-500"
              }`}
            >
              <div className="text-xl font-semibold">{p.title}</div>
              <div className="text-sm text-slate-400 mt-1">{p.desc}</div>
              {p.lockDays > 0 && (
                <div className="text-xs text-amber-400 mt-2">🔒 {p.lockDays} days lock</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Stat title="Staked" value={`${fmtNum(staked, 4)} SLD`} />
        <Stat title="Pending" value={`${fmtNum(pending, 6)} SLD`} highlight />
        <Stat
          title="APR"
          value={`${aprPercent}%`}
          tooltip={`APR = (rewardRateBps / 10,000) × 100\nExample: 250 bps → 2.5% APR`}
        />
        <Stat title="Pool TVL" value={`${fmtNum(tvl, 2)} SLD`} />
      </div>

      {/* Lock / vesting countdown */}
      {activePool.lockDays > 0 && (
        <div className={card}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Lock / Vesting</div>
              <div className={`text-sm ${subtle}`}>
                Countdown is based on your last <code>Staked</code> event (server indexed).
              </div>
            </div>

            <div className="sm:text-right">
              <div className={`text-xs ${subtle}`}>Status</div>
              <div className={`text-lg font-bold ${locked ? "text-amber-400" : "text-emerald-400"}`}>
                {lockLoading ? "Loading…" : locked ? "Locked" : "Unlocked"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4">
              <div className={subtle}>Last stake</div>
              <div className="font-semibold">
                {lastStakeTs ? new Date(lastStakeTs * 1000).toLocaleString() : "--"}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4">
              <div className={subtle}>Unlock time</div>
              <div className="font-semibold">
                {unlockTs ? new Date(unlockTs * 1000).toLocaleString() : "--"}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4">
              <div className={subtle}>Remaining</div>
              <div className="font-semibold">
                {remaining === null
                  ? "--"
                  : remaining <= 0
                  ? "0d 0h 0m 0s"
                  : (() => {
                      const { d, h, m, s } = secondsToParts(remaining);
                      return `${d}d ${h}h ${m}m ${s}s`;
                    })()}
              </div>
            </div>
          </div>

          {locked && (
            <p className={`mt-3 text-xs ${subtle}`}>
              If your contract enforces lock on-chain, <b>Unstake/Exit</b> may revert until unlock.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={`${card} max-w-2xl`}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Amount + MAX */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Amount (SLD)</div>

            <div className="flex gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.0"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700
                           focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={onMax}
                disabled={!isConnected || tokenBal <= 0 || busy}
                className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold
                           disabled:opacity-50"
              >
                MAX
              </button>
            </div>

            <div className={`text-xs ${subtle}`}>
              Wallet balance: {fmtNum(tokenBal, 6)} SLD
            </div>

            {!hasAllowance && parsedAmount > BigInt(0) && (
              <div className="text-xs text-amber-300">
                You must approve before staking this amount.
              </div>
            )}

            {txHash && (
              <div className={`text-xs ${subtle} break-all`}>Tx: {txHash}</div>
            )}

            {receipt.isSuccess && (
              <div className="text-xs text-emerald-400">Transaction confirmed ✅</div>
            )}

            {(receipt.isError || writeError) && errorMsg && (
              <div className="text-xs text-rose-300">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={doApprove}
                disabled={!isConnected || parsedAmount <= BigInt(0) || busy}
                className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold disabled:opacity-50"
              >
                {txMode === "approve" && busy ? "Approving…" : "Approve"}
              </button>

              <button
                onClick={doStake}
                disabled={!isConnected || parsedAmount <= BigInt(0) || !hasAllowance || busy}
                className="px-4 py-3 rounded-xl bg-yellow-400 text-black font-semibold disabled:opacity-50"
              >
                {txMode === "stake" && busy ? "Staking…" : "Stake"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={doClaim}
                disabled={!isConnected || busy}
                className="px-4 py-3 rounded-xl bg-emerald-500 text-black font-semibold disabled:opacity-50"
              >
                {txMode === "claim" && busy ? "Claiming…" : "Claim"}
              </button>

              <button
                onClick={doCompound}
                disabled={!isConnected || pendingRaw === undefined || pendingRaw <= BigInt(0) || busy}
                className="px-4 py-3 rounded-xl bg-yellow-500 text-black font-semibold disabled:opacity-50"
                title="Compound runs Claim → (Approve if needed) → Stake using your claimed rewards."
              >
                {txMode?.startsWith("compound") && busy ? "Compounding…" : "Compound"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={doUnstake}
                disabled={!isConnected || parsedAmount <= BigInt(0) || busy || actionDisabledBecauseLock}
                title={actionDisabledBecauseLock ? lockReason : "unstake(poolId, amount)"}
                className="px-4 py-3 rounded-xl bg-slate-800 text-white font-semibold disabled:opacity-50"
              >
                {txMode === "unstake" && busy ? "Unstaking…" : "Unstake"}
              </button>

              <button
                onClick={doExit}
                disabled={!isConnected || busy || actionDisabledBecauseLock}
                title={actionDisabledBecauseLock ? lockReason : "exit(poolId)"}
                className="px-4 py-3 rounded-xl bg-rose-600 text-white font-bold disabled:opacity-50"
              >
                {txMode === "exit" && busy ? "Exiting…" : "Exit (Emergency)"}
              </button>
            </div>

            <div className={`text-xs ${subtle}`}>
              “Exit” calls <code>exit(poolId)</code>. (Emergency withdraw flow if supported by your contract.)
            </div>
          </div>
        </div>
      </div>

      {/* APR History */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">APR History</h2>
          <div className={`text-xs ${subtle}`}>
            {aprLoading ? "Loading…" : aprPoints.length ? `${aprPoints.length} points` : "No data"}
          </div>
        </div>

        <p className={`text-sm mt-1 ${subtle}`}>
          Pulled from <code>RewardRateUpdated</code> events (server indexed).
        </p>

        <div className="mt-4 rounded-xl bg-slate-950/40 border border-slate-800 p-4">
          {!aprChart ? (
            <div className="h-40 flex items-center justify-center text-slate-500">
              Chart placeholder (no events yet)
            </div>
          ) : (
            <svg viewBox="0 0 900 160" className="w-full h-40 text-slate-200">
              <path d={aprChart.d} fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
          )}

          {aprPoints.length > 0 && (
            <div className={`mt-2 text-xs ${subtle}`}>
              Latest APR:{" "}
              <span className="text-yellow-300 font-semibold">
                {aprPoints[aprPoints.length - 1]?.apr.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  highlight,
  tooltip,
}: {
  title: string;
  value: string;
  highlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="border border-slate-700/70 bg-slate-900/40 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-1 text-sm text-slate-400">
        {title}
        {tooltip && (
          <span title={tooltip} className="cursor-help select-none">
            ⓘ
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold mt-1 ${highlight ? "text-emerald-400" : ""}`}>
        {value}
      </div>
    </div>
  );
}
