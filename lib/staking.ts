import { formatUnits } from "viem";

export function bpsToApr(bps: bigint | number) {
  return Number(bps) / 100;
}

export function secondsToDays(seconds: number) {
  return Math.max(0, Math.floor(seconds / 86400));
}

export function formatSLD(value: bigint) {
  return Number(formatUnits(value, 18));
}
