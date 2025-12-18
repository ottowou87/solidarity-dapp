'use client'

import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'

import { presaleContract, stakingContract } from '@/lib/contracts'
import { parseEther, parseUnits } from 'viem'

export default function AdminPage() {
  /* ------------------------- Hooks (must run first) ------------------------- */
  const { address, isConnected } = useAccount()

  const { data: owner } = useReadContract({
    ...presaleContract,
    functionName: 'owner'
  })

  const { data: saleActive } = useReadContract({
    ...presaleContract,
    functionName: 'saleActive'
  })

  const { data: currentRate } = useReadContract({
    ...presaleContract,
    functionName: 'rate'
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash
  })

  /* ------------------------- Local State ------------------------- */
  const [presaleRate, setPresaleRate] = useState('')
  const [poolId, setPoolId] = useState(0)
  const [poolRateBps, setPoolRateBps] = useState('')
  const [withdrawBnb, setWithdrawBnb] = useState('')
  const [withdrawTokens, setWithdrawTokens] = useState('')
  const [error, setError] = useState<string | null>(null)

  const busy = isPending || confirming

  /* ------------------------- Ownership Check ------------------------- */
  const isOwner =
    isConnected &&
    owner?.toString().toLowerCase() === address?.toLowerCase()

  if (!isOwner) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <h1 className="text-4xl font-bold text-gold glow-gold">Admin Panel</h1>
        <p className="text-rose-400">You are not authorized.</p>

        <div className="text-xs text-slate-500 break-all">
          Connected: {address ?? 'None'}
          <br />
          Owner: {owner?.toString()}
        </div>
      </div>
    )
  }

  /* ------------------------- Contract Actions ------------------------- */
  const startSale = () =>
    writeContract({ ...presaleContract, functionName: 'startSale' })

  const stopSale = () =>
    writeContract({ ...presaleContract, functionName: 'stopSale' })

  const updatePresaleRate = () => {
    if (!presaleRate) return setError('Enter a rate')
    writeContract({
      ...presaleContract,
      functionName: 'setRate',
      args: [BigInt(presaleRate)]
    })
  }

  const withdrawBNB = () => {
    if (!withdrawBnb) return setError('Enter amount')
    writeContract({
      ...presaleContract,
      functionName: 'withdrawBNB',
      args: [parseEther(withdrawBnb)]
    })
  }

  const withdrawSLD = () => {
    if (!withdrawTokens) return setError('Enter amount')
    writeContract({
      ...presaleContract,
      functionName: 'withdrawTokens',
      args: [parseUnits(withdrawTokens, 18)]
    })
  }

  const updatePoolRate = () => {
    if (!poolRateBps) return setError('Enter BPS rate')
    writeContract({
      ...stakingContract,
      functionName: 'setRewardRate',
      args: [poolId, BigInt(poolRateBps)]
    })
  }

  /* ------------------------- Render UI ------------------------- */
  return (
    <div className="space-y-10 animate-fadeIn">
      <h1 className="text-5xl font-extrabold text-gold glow-gold mb-4">
        Admin Panel
      </h1>

      {/* STATUS CARD */}
      <div className="card-ui space-y-1">
        <p><strong>Connected:</strong> {address}</p>
        <p><strong>Owner:</strong> {owner?.toString()}</p>
        <p>
          <strong>Sale:</strong>{' '}
          {saleActive ? (
            <span className="text-emerald-400">Active</span>
          ) : (
            <span className="text-rose-400">Inactive</span>
          )}
        </p>
        <p>
          <strong>Rate:</strong> {currentRate?.toString()} SLD / BNB
        </p>
      </div>

      {/* CONTROLS SECTION */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* SALE CONTROLS */}
        <div className="card-ui">
          <h2 className="card-title">Private Sale Controls</h2>
          <div className="flex gap-3">
            <button disabled={busy} onClick={startSale} className="btn-green">
              Start Sale
            </button>
            <button disabled={busy} onClick={stopSale} className="btn-red">
              Stop Sale
            </button>
          </div>
        </div>

        {/* UPDATE RATE */}
        <div className="card-ui">
          <h2 className="card-title">Update Presale Rate</h2>
          <input
            type="number"
            placeholder="SLD per 1 BNB"
            className="input-ui"
            value={presaleRate}
            onChange={(e) => setPresaleRate(e.target.value)}
          />
          <button disabled={busy} onClick={updatePresaleRate} className="btn-yellow">
            Update Rate
          </button>
        </div>
      </div>

      {/* STAKING POOLS */}
      <div className="card-ui max-w-2xl">
        <h2 className="card-title">Staking Pools</h2>

        <div className="grid grid-cols-2 gap-4">
          <select
            className="input-ui"
            value={poolId}
            onChange={(e) => setPoolId(Number(e.target.value))}
          >
            <option value={0}>Pool 0</option>
            <option value={1}>Pool 1</option>
            <option value={2}>Pool 2</option>
          </select>

          <input
            type="number"
            placeholder="New rate (BPS)"
            className="input-ui"
            value={poolRateBps}
            onChange={(e) => setPoolRateBps(e.target.value)}
          />
        </div>

        <button disabled={busy} onClick={updatePoolRate} className="btn-green">
          Update Pool Rate
        </button>
      </div>

      {/* WITHDRAW SECTION */}
      <div className="grid lg:grid-cols-2 gap-6">

        <div className="card-ui">
          <h2 className="card-title">Withdraw BNB</h2>
          <input
            type="number"
            placeholder="BNB amount"
            className="input-ui"
            value={withdrawBnb}
            onChange={(e) => setWithdrawBnb(e.target.value)}
          />
          <button disabled={busy} onClick={withdrawBNB} className="btn-yellow">
            Withdraw BNB
          </button>
        </div>

        <div className="card-ui">
          <h2 className="card-title">Withdraw SLD</h2>
          <input
            type="number"
            placeholder="SLD tokens"
            className="input-ui"
            value={withdrawTokens}
            onChange={(e) => setWithdrawTokens(e.target.value)}
          />
          <button disabled={busy} onClick={withdrawSLD} className="btn-red">
            Withdraw SLD
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
      {txHash && <p className="text-xs text-slate-400 break-all">Tx: {txHash}</p>}
      {isSuccess && (
        <p className="text-xs text-emerald-400">Transaction confirmed.</p>
      )}
    </div>
  )
}
