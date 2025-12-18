// app/faq/page.tsx
export default function FaqPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">FAQ</h1>
        <p className="text-sm text-slate-400">
          Frequently asked questions about Solidarity (SLD) and the official DApp.
        </p>
      </header>

      <div className="space-y-6 text-sm">
        <section>
          <h2 className="font-semibold">1. What is Solidarity (SLD)?</h2>
          <p>
            Solidarity is a BEP-20 token on Binance Smart Chain designed for a
            community of long-term holders. It offers a private sale, staking
            rewards and a transparent on-chain ecosystem.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. How do I join the private sale?</h2>
          <p>
            Connect your wallet (MetaMask or a compatible BSC wallet) using the
            connect button in the header, then visit the{' '}
            <a href="/private-sale" className="underline">
              Private Sale
            </a>{' '}
            page. Enter the BNB amount you wish to contribute and confirm the
            transaction. The DApp shows an estimated SLD amount based on the
            current on-chain rate.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Which network do I need?</h2>
          <p>
            The token and presale run on Binance Smart Chain (BSC). Make sure
            your wallet is connected to BSC mainnet before participating.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. How do I stake my SLD?</h2>
          <p>
            After acquiring SLD, go to the{' '}
            <a href="/staking" className="underline">
              Staking
            </a>{' '}
            page. Connect your wallet, select a pool, enter the amount of SLD
            you want to lock and confirm the stake transaction. You can later
            unstake, claim rewards or exit a pool from the same DApp.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Is there a minimum amount to participate?</h2>
          <p>
            Minimum and maximum contribution limits, if any, are enforced by the
            presale smart contract. Always double-check the values on the DApp
            interface and in official announcements.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. Is SLD a guaranteed investment?</h2>
          <p>
            No. SLD is a cryptocurrency token and carries risk. Prices can go
            up or down, and there is no guarantee of profit. The project is
            community-driven and focuses on transparency and long-term building.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">7. Where can I verify the contracts?</h2>
          <p>
            Always verify contract addresses on BscScan and through official
            Solidarity channels:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Token: 0xb10c8C889a23C4835Ea4F5962666b0B8da891B1A</li>
            <li>Staking: 0x795DdEa0076057EE802Bb02324Ac92aba8f401A1</li>
            <li>Presale: 0xfda1788ba053632AB9b757098839ce45c330175F</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
