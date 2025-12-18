// app/whitepaper/page.tsx
export default function WhitepaperPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Solidarity (SLD) Whitepaper</h1>
        <p className="text-sm text-slate-400">
          Version 1.0 · Community-focused BEP-20 token on Binance Smart Chain.
        </p>
      </header>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">1. Introduction</h2>
        <p>
          Solidarity (SLD) is a community-driven BEP-20 token deployed on the
          Binance Smart Chain. The project is built around a simple idea: when
          people pool resources and support each other, everyone becomes
          stronger. SLD combines a fair private sale, transparent tokenomics and
          staking rewards to encourage long-term participation instead of
          short-term speculation.
        </p>
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">2. Vision &amp; Mission</h2>
        <p>
          The vision of Solidarity is to become a long-term digital asset used by
          a global community that values transparency, fairness and shared
          growth. The mission is to provide:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Accessible entry via a simple private sale and DApp interface.</li>
          <li>Incentives for holders through staking rewards.</li>
          <li>Clear communication around allocations, contracts and risks.</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">3. Token Details</h2>
        <ul className="space-y-1">
          <li><span className="font-semibold">Name:</span> Solidarity</li>
          <li><span className="font-semibold">Symbol:</span> SLD</li>
          <li><span className="font-semibold">Standard:</span> BEP-20</li>
          <li><span className="font-semibold">Network:</span> Binance Smart Chain</li>
          <li><span className="font-semibold">Total Supply:</span> 510,000,000,000 SLD</li>
          <li><span className="font-semibold">Token Contract:</span> 0xb10c8C889a23C4835Ea4F5962666b0B8da891B1A</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">4. Tokenomics (High-Level)</h2>
        <p>
          The SLD supply is fixed at 510 billion tokens. The intended allocation
          can be summarized as:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-semibold">Private Sale:</span> SLD sold via the official DApp in exchange for BNB.</li>
          <li><span className="font-semibold">Liquidity:</span> A portion reserved to seed and support liquidity pools.</li>
          <li><span className="font-semibold">Staking Rewards:</span> Tokens reserved for rewarding long-term stakers.</li>
          <li><span className="font-semibold">Reserve / Ecosystem:</span> Tokens for future partnerships, listings and ecosystem tools.</li>
        </ul>
        <p className="text-xs text-slate-400">
          Exact percentages and wallets can be published in a detailed token
          allocation table once finalized.
        </p>
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">5. Private Sale Mechanics</h2>
        <p>
          The SLD private sale is conducted exclusively through the official
          Solidarity DApp. Buyers connect their wallet, send BNB and receive
          SLD according to a fixed rate configured in the presale contract:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Presale contract: 0xfda1788ba053632AB9b757098839ce45c330175F</li>
          <li>Tokens per BNB: defined on-chain via the <code>rate</code> variable.</li>
          <li>Sale status controlled by <code>startSale</code> / <code>stopSale</code>.</li>
        </ul>
        <p>
          All funds are collected directly by the presale contract. The owner
          can withdraw BNB and any unsold tokens using transparent functions
          available in the contract.
        </p>
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">6. Staking</h2>
        <p>
          Holders can lock SLD into the official staking contract to earn
          additional SLD over time. Pools with different reward rates (bps) can
          be configured by the contract owner, and users can choose the pool
          that best matches their risk and time preference.
        </p>
        <p>
          Staking is accessed directly through the DApp&apos;s staking page.
          Rewards can be monitored and claimed in real time using the same
          wallet that holds the SLD.
        </p>
      </section>

      <section className="space-y-3 text-sm">
        <h2 className="text-xl font-semibold">7. Risks &amp; Disclaimer</h2>
        <p>
          Cryptocurrencies and smart contracts carry technical and market
          risks, including volatility, bugs and regulatory uncertainty. Nothing
          in this whitepaper or on the website is financial advice. Always do
          your own research and never invest more than you can afford to lose.
        </p>
      </section>
    </div>
  )
}
