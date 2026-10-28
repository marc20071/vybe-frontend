import { useId } from "react";

type BrandMarkProps = { size?: number };

export function BrandMark({ size = 34 }: BrandMarkProps) {
  const gradientId = `vybe-mark-${useId().replace(/:/g, "")}`;

  return (
    <span
      className="brand-mark"
      aria-hidden="true"
      style={{ width: size, height: size, flex: `0 0 ${size}px` }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} focusable="false" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="8%" y1="8%" x2="92%" y2="92%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="38%" stopColor="#818cf8" />
            <stop offset="70%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <path
          d="M 13 16 L 27 46 Q 30 53 34 46 L 51 16"
          fill="none"
          stroke="#090817"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 13 16 L 27 46 Q 30 53 34 46 L 51 16"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M 18 17 L 28 37" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
