import { NextResponse } from 'next/server'

type PoolId = 0 | 1 | 2

// In-memory cache (dev + single instance)
// For production persistence, replace with DB/KV.
const globalAny = globalThis as Record<string, unknown>
if (!globalAny.__SLD_APR_HISTORY__) {
  globalAny.__SLD_APR_HISTORY__ = {
    0: [] as number[],
    1: [] as number[],
    2: [] as number[],
  }
}
const store = globalAny.__SLD_APR_HISTORY__ as Record<PoolId, number[]>

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const poolId = Number(searchParams.get('poolId') ?? '0') as PoolId

  const safePool: PoolId = poolId === 1 ? 1 : poolId === 2 ? 2 : 0
  return NextResponse.json({ history: store[safePool] ?? [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const poolId = Number(body?.poolId ?? 0) as PoolId
    const apr = Number(body?.apr)

    const safePool: PoolId = poolId === 1 ? 1 : poolId === 2 ? 2 : 0
    if (!Number.isFinite(apr) || apr < 0 || apr > 100000) {
      return NextResponse.json({ ok: false, error: 'Invalid APR' }, { status: 400 })
    }

    const prev = store[safePool] ?? []
    const next = [...prev, apr].slice(-12) // keep last 12 points
    store[safePool] = next

    return NextResponse.json({ ok: true, history: next })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
