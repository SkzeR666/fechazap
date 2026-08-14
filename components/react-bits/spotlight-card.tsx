"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 40 });

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        setSpot({
          x: ((event.clientX - box.left) / box.width) * 100,
          y: ((event.clientY - box.top) / box.height) * 100,
        });
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, rgba(234,179,8,0.18), transparent 55%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
