"use client";

function shortAddress(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function HomePage() {
  const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_SLD_CONTRACT || "").trim();
  const BSCSCAN_BASE =
    (process.env.NEXT_PUBLIC_BSCSCAN_BASE || "https://bscscan.com").trim();

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

  function copyAddress() {
    if (!isValidAddress) return;
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    alert("Contract address copied");
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <main className="relative overflow-hidden">
        {/* FLOATING LOGO (DESKTOP ONLY) */}
        <div className="absolute right-12 top-28 hidden md:block opacity-80 animate-float-slow">
          <img
            src="/logo-sld.png"
            width={120}
            height={120}
            alt="SLD Coin"
            className="drop-shadow-[0_0_30px_rgba(255,200,60,0.45)]"
          />
        </div>

        {/* HERO */}
        <section className="text-center space-y-4 pt-6 md:pt-8 pb-8 max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#F6D675] drop-shadow-lg">
            Solidarity (SLD)
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            A community-powered BEP-20 token on Binance Smart Chain — designed for{" "}
            <span className="text-yellow-300 font-semibold">fair participation</span>,{" "}
            <span className="text-yellow-300 font-semibold">mutual support</span>, and{" "}
            <span className="text-yellow-300 font-semibold">
              long-term staking rewards
            </span>
            .
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-1">
            <a
              href="/private-sale"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-500 text-slate-900 font-semibold shadow-lg hover:brightness-110 transition"
            >
              Join Private Sale
            </a>

            <a
              href="/staking"
              className="px-6 py-3 rounded-xl bg-[#0E1527] border border-slate-700 text-white font-semibold shadow-md hover:bg-[#111a33] transition"
            >
              Stake SLD
            </a>
          </div>

          {/* CONTRACT (SAFE) */}
          <div className="pt-4 text-xs md:text-sm text-slate-400">
            SLD Contract:{" "}
            {isValidAddress ? (
              <span className="inline-flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="text-yellow-300 font-mono hover:underline"
                >
                  {shortAddress(CONTRACT_ADDRESS)}
                </button>
                <a
                  href={`${BSCSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-yellow-200 underline underline-offset-4"
                >
                  View on BscScan
                </a>
              </span>
            ) : (
              <span className="text-slate-500">
                Contract published at launch
              </span>
            )}
          </div>
        </section>

        {/* TRUST BADGES */}
        <section className="px-4 pb-10">
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {[
              "✔ Fixed Supply",
              "✔ No Mint / No Tax",
              "✔ BEP-20 Verified",
              "🔒 Liquidity Lock Planned",
            ].map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full bg-[#0B1222] border border-slate-800 text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-500 text-center mt-3">
            All contracts will be verified and publicly auditable on BscScan.
          </p>
        </section>

        {/* STATS */}
        <section className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 pb-20">
          {[
            {
              title: "Total Supply",
              value: "510,000,000,000 SLD",
              desc: "Fixed supply. No mint or inflation.",
            },
            {
              title: "Network",
              value: "Binance Smart Chain (BEP-20)",
              desc: "Low fees • Fast transactions",
            },
            {
              title: "Core Utility",
              value: "Staking • Rewards • Community",
              desc: "Passive rewards and ecosystem growth.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-[#0B1222] rounded-2xl p-6 border border-slate-800 shadow-xl"
            >
              <h3 className="text-slate-400 text-sm font-semibold mb-2">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-yellow-300">{card.value}</p>
              <p className="text-slate-400 text-sm mt-2">{card.desc}</p>
            </div>
          ))}
        </section>

        {/* AUDIT & TRANSPARENCY */}
        <section className="max-w-6xl mx-auto px-6 pb-24 space-y-10">
          <h2 className="text-3xl font-bold text-center text-yellow-300">
            Audit & Transparency
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#0B1222] rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                Smart Contract
              </h3>
              <p className="text-slate-300 text-sm">
                SLD uses a standard BEP-20 implementation with no mint, no hidden
                ownership privileges, and no transfer taxes.
              </p>
            </div>

            <div className="bg-[#0B1222] rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                Liquidity Safety
              </h3>
              <p className="text-slate-300 text-sm">
                Liquidity will be locked after launch to support long-term
                stability and protect holders.
              </p>
            </div>

            <div className="bg-[#0B1222] rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                Public Verification
              </h3>
              <p className="text-slate-300 text-sm">
                The contract will be verified on BscScan for full transparency
                and public review.
              </p>
            </div>
          </div>
        </section>

        {/* BITCOINTALK SUMMARY */}
        <section className="max-w-5xl mx-auto px-6 pb-24 space-y-6">
          <h2 className="text-3xl font-bold text-center text-yellow-300">
            Bitcointalk Announcement Summary
          </h2>

          <div className="bg-[#0B1222] rounded-2xl p-6 border border-slate-800 text-sm text-slate-300 leading-relaxed">
            <p className="mb-3 font-semibold text-yellow-200">
              Solidarity (SLD) — BEP-20 Community Staking Token
            </p>

            <p className="mb-2">
              Solidarity (SLD) is a community-powered BEP-20 token on Binance Smart
              Chain, designed to reward long-term participants through staking and
              transparent tokenomics.
            </p>

            <p className="mb-2">
              ✔ Fixed total supply: 510,000,000,000 SLD <br />
              ✔ No mint function, no hidden taxes <br />
              ✔ Staking-focused utility <br />
              ✔ Liquidity lock planned post-launch <br />
              ✔ Community-first distribution
            </p>

            <p>
              The goal of Solidarity is to build a fair, transparent ecosystem where
              holders benefit from long-term participation rather than short-term
              speculation.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center text-slate-600 py-10 text-xs">
          © 2025 Solidarity (SLD). All rights reserved.
        </footer>

        {/* FLOAT ANIMATION */}
        <style jsx global>{`
          @keyframes floatSlow {
            0% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-10px) rotate(6deg);
            }
            100% {
              transform: translateY(0) rotate(0deg);
            }
          }
          .animate-float-slow {
            animation: floatSlow 10s ease-in-out infinite;
          }
        `}</style>
      </main>
    </div>
  );
}
