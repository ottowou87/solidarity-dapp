// lib/contracts.ts
import { presaleAbi } from '@/abis/presaleAbi'
import { tokenAbi } from '@/abis/tokenAbi'
import { stakingAbi } from '@/abis/stakingAbi'

export const SLD_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_SLD_TOKEN_ADDRESS as `0x${string}`

export const STAKING_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}`

export const PRESALE_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_PRESALE_CONTRACT_ADDRESS as `0x${string}`

export const presaleContract = {
  address: PRESALE_CONTRACT_ADDRESS,
  abi: presaleAbi
} as const

export const tokenContract = {
  address: SLD_TOKEN_ADDRESS,
  abi: tokenAbi
} as const

export const stakingContract = {
  address: STAKING_CONTRACT_ADDRESS,
  abi: stakingAbi
} as const
