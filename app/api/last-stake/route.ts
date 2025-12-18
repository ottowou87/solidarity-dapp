import { NextResponse } from "next/server";

/**
 * Staked(address,uint8,uint256)
 * keccak256 hash (CONFIRMED):
 * 0x3cf14181ae25669a913d72411736fc5c01f538fa503e963b0b2e56bcefb3edaf
 */
const STAKED_TOPIC =
  "0x3cf14181ae25669a913d72411736fc5c01f538fa503e963b0b2e56bcefb3edaf";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const user = searchParams.get("user");
    const poolId = searchParams.get("poolId");
    const contract = process.env.NEXT_PUBLIC_STAKING_CONTRACT;

    if (!user || poolId === null || !contract) {
      return NextResponse.json(
        { error: "Missing user, poolId, or contract" },
        { status: 400 }
      );
    }

    const apiKey = process.env.BSCSCAN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "BSCSCAN_API_KEY not set" },
        { status: 500 }
      );
    }

    // topic1 = indexed user address
    const topic1 =
      "0x" + user.toLowerCase().replace("0x", "").padStart(64, "0");

    // topic2 = indexed poolId (uint8 padded)
    const topic2 =
      "0x" + BigInt(poolId).toString(16).padStart(64, "0");

    const url =
      `https://api.bscscan.com/api?module=logs&action=getLogs` +
      `&fromBlock=0&toBlock=latest` +
      `&address=${contract}` +
      `&topic0=${STAKED_TOPIC}` +
      `&topic1=${topic1}` +
      `&topic2=${topic2}` +
      `&apikey=${apiKey}`;

    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    if (!Array.isArray(json?.result) || json.result.length === 0) {
      return NextResponse.json({ timeStamp: null });
    }

    // latest stake = last log
    const last = json.result[json.result.length - 1];
    const timeStamp = Number(last.timeStamp);

    return NextResponse.json({
      timeStamp: Number.isFinite(timeStamp) ? timeStamp : null,
    });
  } catch (err) {
    console.error("last-stake api error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
