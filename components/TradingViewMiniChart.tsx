'use client'

import { useEffect, useRef } from 'react'

export default function TradingViewMiniChart() {
  const containerRef = useRef<HTMLDivElement>(null)

  // ---- FIXED: Always use a stable empty dependency array ----
  useEffect(() => {
    if (!containerRef.current) return

    // Clean previous widget instance
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.async = true

    script.innerHTML = JSON.stringify({
      symbol: 'BINANCE:BNBUSDT',
      width: '100%',
      height: '250',
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      trendLineColor: '#facc15',
      underLineColor: 'rgba(250,204,21,0.1)',
      isTransparent: true
    })

    containerRef.current.appendChild(script)
  }, []) // <--- ALWAYS empty, always stable

  return (
    <div className="w-full h-[250px] rounded-xl border border-slate-800 bg-slate-900/60 p-1">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
