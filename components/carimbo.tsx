"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

export function Carimbo({
  label,
  animate = false,
  size = "md",
  className,
}: {
  label: string;
  animate?: boolean;
  size?: Size;
  className?: string;
}) {
  return (
    <motion.div
      initial={animate ? { scale: 1.15, rotate: -18 } : { scale: 1, rotate: -8 }}
      animate={{ scale: 1, rotate: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center justify-center rounded-full border-2 border-double border-primary text-center font-mono font-semibold uppercase tracking-wider text-primary",
        size === "sm"
          ? "size-14 px-1 text-[8px] leading-tight"
          : "size-20 px-2 text-[10px] leading-tight",
        className,
      )}
      aria-label={label}
    >
      {label}
    </motion.div>
  );
}
