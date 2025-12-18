export const runtime = "nodejs";

export async function GET() {
  try {
    const key = process.env.BSCSCAN_API_KEY;
    if (!key) {
      return Response.json({ ok: false, gwei: null, message: "Missing BSCSCAN_API_KEY" }, { status: 200 });
    }

    const url = `https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=${key}`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();

    const gwei = j?.result?.ProposeGasPrice ? Number(j.result.ProposeGasPrice) : null;

    return Response.json({ ok: true, gwei }, { status: 200 });
  } catch {
    return Response.json({ ok: false, gwei: null, message: "Gas fetch failed" }, { status: 200 });
  }
}
