'use client'

import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { tokenContract, presaleContract, stakingContract } from '@/lib/contracts'
import { formatUnits } from 'viem'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

type UserInfo = readonly [bigint, bigint, bigint, bigint]

export default function DashboardPage() {
  // Safe mount flag (no effect)
  const mounted = true

  // ---- Hooks ALWAYS run, even during first render ----
  const { address, isConnected } = useAccount()

  // Token balance
  const { data: balance } = useReadContract({
    ...tokenContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Total supply
  const { data: totalSupply } = useReadContract({
    ...tokenContract,
    functionName: 'totalSupply',
  })

  // Presale status
  const { data: saleActive } = useReadContract({
    ...presaleContract,
    functionName: 'saleActive',
  })

  // ---- REAL STAKING ANALYTICS (3 pools: 0, 1, 2) ----
  const { data: pool0Info } = useReadContract({
    ...stakingContract,
    functionName: 'getUserInfo',
    args: address ? [address, 0] : undefined,
  })

  const { data: pool1Info } = useReadContract({
    ...stakingContract,
    functionName: 'getUserInfo',
    args: address ? [address, 1] : undefined,
  })

  const { data: pool2Info } = useReadContract({
    ...stakingContract,
    functionName: 'getUserInfo',
    args: address ? [address, 2] : undefined,
  })

  const p0 = pool0Info as UserInfo | undefined
  const p1 = pool1Info as UserInfo | undefined
  const p2 = pool2Info as UserInfo | undefined

  const pool0Staked = p0 ? Number(formatUnits(p0[0], 18)) : 0
  const pool0Pending = p0 ? Number(formatUnits(p0[1], 18)) : 0
  const pool0Apr = p0 ? Number(p0[2]) / 100 : 0

  const pool1Staked = p1 ? Number(formatUnits(p1[0], 18)) : 0
  const pool1Pending = p1 ? Number(formatUnits(p1[1], 18)) : 0
  const pool1Apr = p1 ? Number(p1[2]) / 100 : 0

  const pool2Staked = p2 ? Number(formatUnits(p2[0], 18)) : 0
  const pool2Pending = p2 ? Number(formatUnits(p2[1], 18)) : 0
  const pool2Apr = p2 ? Number(p2[2]) / 100 : 0

  const userTotalStaked = pool0Staked + pool1Staked + pool2Staked
  const userTotalPending = pool0Pending + pool1Pending + pool2Pending

  const formattedBalance =
    balance !== undefined
      ? Number(formatUnits(balance as bigint, 18)).toLocaleString()
      : '0'

  const formattedSupply =
    totalSupply !== undefined
      ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString()
      : '0'

  const perPoolData = [
    { pool: 'Pool 0', staked: pool0Staked, pending: pool0Pending, apr: pool0Apr },
    { pool: 'Pool 1', staked: pool1Staked, pending: pool1Pending, apr: pool1Apr },
    { pool: 'Pool 2', staked: pool2Staked, pending: pool2Pending, apr: pool2Apr },
  ]

  const tvlData = perPoolData.map(p => ({ pool: p.pool, tvl: p.staked }))
  const rewardsData = perPoolData.map(p => ({ pool: p.pool, pending: p.pending }))
  const aprData = perPoolData.map(p => ({ pool: p.pool, apr: p.apr }))

  if (!mounted) {
    return <div className="text-slate-400">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-6">
          <h2 className="text-sm text-slate-400 mb-2">Wallet</h2>
          <p className="font-semibold break-all">
            {isConnected ? address : 'Not connected'}
          </p>
        </div>

        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-6">
          <h2 className="text-sm text-slate-400 mb-2">Your SLD Balance</h2>
          <p className="text-xl font-bold text-yellow-300">{formattedBalance}</p>
          <p className="text-sm">SLD</p>
        </div>

        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-6">
          <h2 className="text-sm text-slate-400 mb-2">Private Sale Status</h2>
          <p className="text-xl font-bold">
            {saleActive ? (
              <span className="text-emerald-400">Active</span>
            ) : (
              <span className="text-rose-400">Inactive</span>
            )}
          </p>
        </div>

        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-6">
          <h2 className="text-sm text-slate-400 mb-2">Your Staked SLD (all pools)</h2>
          <p className="text-xl font-bold text-emerald-400">
            {userTotalStaked.toLocaleString()} SLD
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pending rewards: {userTotalPending.toLocaleString()} SLD
          </p>
        </div>
      </div>

      <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-6 max-w-md">
        <h2 className="text-sm text-slate-400 mb-2">Total Supply</h2>
        <p className="text-xl font-bold">{formattedSupply} SLD</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-4">
          <h2 className="text-sm text-slate-400 mb-2">
            Your Staked SLD per Pool
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tvlData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pool" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tvl" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-4">
          <h2 className="text-sm text-slate-400 mb-2">
            Pending Rewards per Pool
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rewardsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pool" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-slate-700 bg-slate-900/40 rounded-2xl p-4 lg:col-span-2">
          <h2 className="text-sm text-slate-400 mb-2">
            APR by Pool (from reward BPS)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={aprData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pool" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="apr" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
