import { cn } from "@/lib/utils";

export function GoldGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `
          linear-gradient(rgba(234,179,8,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(234,179,8,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "56px 56px",
        maskImage:
          "radial-gradient(ellipse at center, black 20%, transparent 72%)",
      }}
    />
  );
}
