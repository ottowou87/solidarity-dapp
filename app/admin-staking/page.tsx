// app/admin-staking/page.tsx 

'use client'
export const dynamic = "force-dynamic";

import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { stakingContract } from '@/lib/contracts'

export default function AdminStakingPage() {
  const { address } = useAccount()

  const { data: numPools } = useReadContract({
    ...stakingContract,
    functionName: 'NUM_POOLS'
  })

  const { data: owner } = useReadContract({
    ...stakingContract,
    functionName: 'owner'
  })

  const [poolId, setPoolId] = useState<number>(0)
  const [newRateBps, setNewRateBps] = useState<string>('0')

  const { data: currentRateBps } = useReadContract({
    ...stakingContract,
    functionName: 'rewardRateBps',
    args: [BigInt(poolId)]
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const totalPools = Number(numPools ?? 0)
  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase()
  const isBusy = isPending || isConfirming

  const handleUpdateRate = () => {
    if (!newRateBps) return
    const value = BigInt(newRateBps)
    writeContract({
      ...stakingContract,
      functionName: 'setRewardRate',
      args: [poolId, value]
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin • Staking</h1>

      <div className="border border-rose-500/40 bg-rose-950/30 rounded-2xl p-4 text-xs space-y-2">
        <div className="font-semibold">Warning</div>
        <p>
          This page is intended for the staking contract owner only.
        </p>
        <p>
          Contract owner: <span className="break-all">{owner as string}</span>
        </p>
        <p>
          Connected wallet: <span className="break-all">{address || 'Not connected'}</span>
        </p>
        {!isOwner && (
          <p className="text-rose-300">
            You are not the owner. Transactions may revert if you call admin functions.
          </p>
        )}
      </div>

      <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40 space-y-4 max-w-lg text-sm">
        <h2 className="text-lg font-semibold">Update Reward Rate (bps)</h2>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Select pool</div>
            {totalPools > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalPools }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPoolId(idx)}
                    className={
                      'px-3 py-1 rounded-full border text-xs ' +
                      (poolId === idx
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-slate-700')
                    }
                  >
                    Pool {idx}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No pools configured.</div>
            )}
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1">Current rate</div>
            <div>
              {(currentRateBps ?? BigInt(0)).toString()} bps
            </div>
          </div>

          <label className="block space-y-1">
            <span>New rate (basis points)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={newRateBps}
              onChange={(e) => setNewRateBps(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700"
            />
            <p className="text-[11px] text-slate-500">
              100 bps = 1%. Example: 500 = 5% APR (depending on your contract&apos;s logic).
            </p>
          </label>

          <button
            disabled={!isOwner || isBusy}
            onClick={handleUpdateRate}
            className="w-full px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold disabled:opacity-50"
          >
            {isBusy ? 'Updating...' : `Update rate for pool ${poolId}`}
          </button>

          {hash && (
            <p className="text-xs break-all text-slate-400">Tx: {hash}</p>
          )}
          {isSuccess && (
            <p className="text-xs text-emerald-400">
              Reward rate updated successfully.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
