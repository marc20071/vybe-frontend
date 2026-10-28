"use client";

import { useEffect, useState } from "react";

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  small?: boolean;
  size?: number;
  className?: string;
  loading?: boolean;
};

export function Avatar({ name, src, small = false, size, className = "", loading = false }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [src]);

  const label = name?.trim() || "VYBE user";
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "V";
  const style = size ? { width: size, height: size, flexBasis: size, minWidth: size, fontSize: Math.max(10, Math.round(size * 0.32)) } : undefined;

  if (loading) {
    return <span className={`avatar avatar-skeleton ${small ? "small" : ""} ${className}`} style={style} aria-label="Loading profile" />;
  }

  return (
    <span className={`avatar ${small ? "small" : ""} ${className}`} style={{ ...style, overflow: "hidden", flexShrink: 0 }} aria-label={`${label} avatar`} title={label}>
      {src && !imageFailed ? (
        <img src={src} alt={`${label}'s profile`} loading="lazy" onError={() => setImageFailed(true)} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
      ) : initials}
    </span>
  );
}
