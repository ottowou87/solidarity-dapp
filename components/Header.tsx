import dynamic from "next/dynamic";

const Header = dynamic(() => import("./Header.client"), {
  ssr: false,
});

export default Header;
