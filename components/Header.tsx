"use client";

import dynamic from "next/dynamic";

const HeaderClient = dynamic(() => import("./Header.client"), {
  ssr: false
});

export function Header({ isLanding }: { isLanding?: boolean }) {
  return <HeaderClient isLanding={isLanding} />;
}

