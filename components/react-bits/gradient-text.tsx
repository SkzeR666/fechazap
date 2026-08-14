"use client";

import { cn } from "@/lib/utils";

export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-[length:200%_auto] bg-clip-text text-transparent",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #FEF3C7, #EAB308, #F59E0B, #FEF3C7)",
        animation: "fechazap-shine 6s linear infinite",
      }}
    >
      {children}
      <style>{`
        @keyframes fechazap-shine {
          to { background-position: 200% center; }
        }
      `}</style>
    </span>
  );
}
