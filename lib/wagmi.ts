// lib/wagmi.ts
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { http } from 'wagmi'
import { bsc } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set in .env.local')
}

export const chains = [bsc] as const

const metadata = {
  name: 'Solidarity (SLD) DApp',
  description: 'Private sale, staking, dashboard & more for the SLD token.',
  url: 'https://solidarity.example',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  transports: {
    [bsc.id]: http(),
  },
})
