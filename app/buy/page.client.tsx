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

export default function BuyPage() {
  const { address, isConnected } = useAccount()
  const [bnbAmount, setBnbAmount] = useState('1')

  // --- Reads ---
  const { data: rate } = useReadContract({
    ...presaleContract,
    functionName: 'rate'
  })

  const { data: saleActive } = useReadContract({
    ...presaleContract,
    functionName: 'saleActive'
  })

  // --- Writes ---
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  // --- Estimated Token Preview ---
  const tokenPreview =
    rate && bnbAmount
      ? Number(rate) * Number(bnbAmount)
      : 0

  const handleBuy = () => {
    if (!bnbAmount) return
    writeContract({
      ...presaleContract,
      functionName: 'buyTokens',
      value: parseEther(bnbAmount)
    })
  }

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold">Buy SLD</h1>

      <p className="text-slate-400 max-w-lg">
        Purchase Solidarity (SLD) directly using BNB at the private-sale rate.
      </p>

      <div className="max-w-lg border border-slate-800 rounded-2xl p-6
                      space-y-4 bg-slate-900/40">

        {/* Status */}
        <div className="text-sm space-y-1">
          <div>
            <span className="font-semibold">Status:</span>{' '}
            {saleActive ? (
              <span className="text-emerald-400">Active</span>
            ) : (
              <span className="text-rose-400">Not active</span>
            )}
          </div>

          <div>
            <span className="font-semibold">Rate:</span>{' '}
            {rate ? `${rate} SLD per 1 BNB` : 'Loading...'}
          </div>

          <div className="break-all">
            <span className="font-semibold">Wallet:</span>{' '}
            {isConnected ? address : 'Not connected'}
          </div>
        </div>

        {/* Input */}
        <label className="block text-sm space-y-1">
          <span>BNB Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950
                       border border-slate-700"
          />
        </label>

        {/* Estimated Tokens */}
        <div className="text-xs text-slate-400 min-h-[1.25rem]">
          Estimated tokens:{' '}
          <span className="text-yellow-400 font-semibold">
            {tokenPreview.toLocaleString()} SLD
          </span>
        </div>

        {/* Button */}
        <button
          disabled={!isConnected || !saleActive || isPending || confirming}
          onClick={handleBuy}
          className="w-full px-4 py-2 rounded-lg bg-yellow-400
                     text-slate-900 font-semibold disabled:opacity-50"
        >
          {isPending || confirming ? 'Processing…' : 'Buy SLD'}
        </button>

        {/* Tx Feedback */}
        {hash && (
          <p className="text-xs text-slate-400 break-all">
            Tx: {hash}
          </p>
        )}

        {isSuccess && (
          <p className="text-xs text-emerald-400">
            Purchase confirmed! Tokens sent to your wallet.
          </p>
        )}
      </div>
    </div>
  )
}
