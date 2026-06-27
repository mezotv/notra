interface LogoProps {
  size: number;
  color?: string;
}

export function EmdashLogo({ size, color = "#171717" }: LogoProps) {
  return (
    <svg fill="none" height={size} viewBox="1 -2 37 37" width={size}>
      <path
        d="M13.2625 13.2642H31.4459L26.1835 19.5786H8L13.2625 13.2642Z"
        fill={color}
      />
    </svg>
  );
}
