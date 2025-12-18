'use client'

import { useEffect, useRef, useState } from 'react'

// TradingView symbols
const SYMBOLS = {
  BNB: 'BINANCE:BNBUSDT',
  SLD: 'BINANCE:BNBUSDT', // placeholder
}

export default function TradingViewSwitcher() {
  const [symbol, setSymbol] = useState<'BNB' | 'SLD'>('BNB')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: SYMBOLS[symbol],
      width: '100%',
      height: '220',
      locale: 'en',
      dateRange: '1D',
      colorTheme: 'dark',
      trendLineColor: '#facc15',
      underLineColor: 'rgba(250, 204, 21, 0.15)',
      autosize: true,
      isTransparent: true,
    })

    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={() => setSymbol('BNB')}
          className={`px-3 py-1 rounded-lg text-sm ${
            symbol === 'BNB'
              ? 'bg-yellow-400 text-black'
              : 'bg-slate-800 text-white'
          }`}
        >
          BNB Chart
        </button>

        <button
          onClick={() => setSymbol('SLD')}
          className={`px-3 py-1 rounded-lg text-sm ${
            symbol === 'SLD'
              ? 'bg-yellow-400 text-black'
              : 'bg-slate-800 text-white'
          }`}
        >
          SLD Chart
        </button>
      </div>

      <div
        ref={containerRef}
        className="rounded-xl border border-slate-700 bg-slate-900/40 p-2 h-[220px] overflow-hidden"
      />
    </div>
  )
}
