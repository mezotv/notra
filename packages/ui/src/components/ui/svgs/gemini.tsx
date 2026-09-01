import { useId, type SVGProps } from "react";

const Gemini = (props: SVGProps<SVGSVGElement>) => {
  const gradientId = `notra-gemini-sparkle-fill-${useId().replaceAll(":", "")}`;

  return (
    <svg {...props} fill="none" overflow="visible" viewBox="0 0 296 298">
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={gradientId}
          x1="28"
          x2="268"
          y1="18"
          y2="280"
        >
          <stop stopColor="#439DDF" />
          <stop offset=".524" stopColor="#4F87ED" />
          <stop offset=".781" stopColor="#9476C5" />
          <stop offset=".888" stopColor="#BC688E" />
          <stop offset="1" stopColor="#D6645D" />
        </linearGradient>
      </defs>
      <path
        d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};

export { Gemini };
