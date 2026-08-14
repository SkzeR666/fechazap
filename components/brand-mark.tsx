import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  withWordmark?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function BrandMark({
  href = "/",
  withWordmark = true,
  size = "md",
  className,
}: BrandMarkProps) {
  const icon = size === "sm" ? 28 : 36;
  const mark = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/icon-gold.png"
        alt=""
        width={icon}
        height={icon}
        className="rounded-md"
        priority
      />
      {withWordmark ? (
        <span className="font-heading text-[1.05em] leading-none tracking-tight">
          <span className="font-extrabold">FECHA</span>
          <span className="font-extralight">ZAP</span>
        </span>
      ) : null}
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="FechaZap">
      {mark}
    </Link>
  );
}
