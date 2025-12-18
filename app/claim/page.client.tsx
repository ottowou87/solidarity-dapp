// app/claim/page.tsx
'use client'

import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { stakingContract } from '@/lib/contracts'

export default function ClaimPage() {
  const { isConnected } = useAccount()
  const [poolId, setPoolId] = useState<number>(0)

  const { data: numPools } = useReadContract({
    ...stakingContract,
    functionName: 'NUM_POOLS'
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const totalPools = Number(numPools ?? 0)
  const isBusy = isPending || isConfirming

  const handleClaim = () => {
    writeContract({
      ...stakingContract,
      functionName: 'claim',
      args: [poolId]
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Claim Rewards</h1>
      <p className="text-sm text-slate-300">
        Choose a staking pool and claim your accumulated SLD rewards for that pool.
      </p>

      <div className="border border-slate-800 rounded-2xl p-6 space-y-4 bg-slate-900/40 max-w-md">
        <div className="text-sm space-y-2">
          <div className="font-semibold">Select pool</div>
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

        <button
          disabled={!isConnected || isBusy}
          onClick={handleClaim}
          className="w-full px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold disabled:opacity-50"
        >
          {isBusy ? 'Claiming...' : `Claim rewards from pool ${poolId}`}
        </button>

        {hash && (
          <p className="text-xs break-all text-slate-400">Tx: {hash}</p>
        )}
        {isSuccess && (
          <p className="text-xs text-emerald-400">Rewards claimed!</p>
        )}
      </div>
    </div>
  )
}
