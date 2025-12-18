'use client'

import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { presaleContract } from '@/lib/contracts'
import { parseEther } from 'viem'

export default function PrivateSalePage() {
  // --- All hooks MUST come first ---
  const { address, isConnected } = useAccount()
  const [bnbAmount, setBnbAmount] = useState('1')

  const { data: rate } = useReadContract({
    ...presaleContract,
    functionName: 'rate'
  })

  const { data: saleActive } = useReadContract({
    ...presaleContract,
    functionName: 'saleActive'
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash
  })

  // --- Calculate tokens ---
  const tokenPreview =
    rate && bnbAmount
      ? Number(rate) * Number(bnbAmount)
      : 0

  // --- UI ---
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight">
          SLD <span className="text-yellow-400">Private Sale</span>
        </h1>
        <p className="mt-3 text-lg text-slate-300 max-w-3xl leading-relaxed">
          Purchase Solidarity (SLD) using BNB at the private-sale rate.
        </p>
      </div>

      <div className="max-w-2xl border border-slate-700 bg-slate-900/50 rounded-3xl p-8 shadow-xl space-y-6 backdrop-blur-sm">

        <div className="space-y-1 text-sm">
          <p>
            <span className="font-semibold text-slate-300">Status:</span>{' '}
            {saleActive ? (
              <span className="text-emerald-400 font-semibold">Active</span>
            ) : (
              <span className="text-rose-400 font-semibold">Not active</span>
            )}
          </p>

          <p>
            <span className="font-semibold text-slate-300">Rate:</span>{' '}
            <span className="text-yellow-300 font-semibold">
              {rate ? `${rate.toString()} SLD per 1 BNB` : 'Loading...'}
            </span>
          </p>

          <p className="truncate">
            <span className="font-semibold text-slate-300">Wallet:</span>{' '}
            {isConnected ? address : 'Not connected'}
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-slate-300">BNB amount</span>
          <input
            type="number"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700"
          />
        </label>

        <div className="text-xs text-slate-400">
          Estimated tokens:{' '}
          <span className="text-yellow-300 font-semibold">
            {tokenPreview.toLocaleString()} SLD
          </span>
        </div>

        <button
          disabled={!isConnected || !saleActive || isPending || confirming}
          onClick={() =>
            writeContract({
              ...presaleContract,
              functionName: 'buyTokens',
              value: parseEther(bnbAmount)
            })
          }
          className="w-full px-4 py-3 rounded-xl bg-yellow-400 text-slate-900 font-bold"
        >
          {isPending || confirming ? 'Processing...' : 'Buy SLD'}
        </button>

        {hash && (
          <p className="text-xs text-slate-500 break-all">
            Tx: {hash}
          </p>
        )}

        {isSuccess && (
          <p className="text-xs text-emerald-400 font-semibold">
            Purchase confirmed — tokens sent to your wallet!
          </p>
        )}
      </div>
    </div>
  )
}
