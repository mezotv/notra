import type { SVGProps } from "react";

const Cursor = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24">
    <title>Cursor</title>
    <path
      d="M12 1 21.53 6.5 12 12 2.47 6.5 12 1Z"
      fill="currentColor"
      fillOpacity="0.35"
    />
    <path
      d="M2.47 6.5 12 12v11L2.47 17.5V6.5Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
    <path d="M21.53 6.5 12 12v11l9.53-5.5V6.5Z" fill="currentColor" />
  </svg>
);

export { Cursor };
