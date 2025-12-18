export const runtime = "nodejs";

export async function GET() {
  try {
    const key = process.env.BSCSCAN_API_KEY;
    const token = process.env.NEXT_PUBLIC_SLD_TOKEN_ADDRESS;

    if (!key) return Response.json({ ok: false, message: "Missing BSCSCAN_API_KEY", result: [] }, { status: 200 });
    if (!token) return Response.json({ ok: false, message: "Missing NEXT_PUBLIC_SLD_TOKEN_ADDRESS", result: [] }, { status: 200 });

    const url =
      `https://api.bscscan.com/api?module=account&action=tokentx` +
      `&contractaddress=${token}` +
      `&sort=desc&page=1&offset=20&apikey=${key}`;

    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();

    const result = Array.isArray(j?.result) ? j.result : [];
    return Response.json({ ok: true, result }, { status: 200 });
  } catch {
    return Response.json({ ok: false, message: "Error", result: [] }, { status: 200 });
  }
}
