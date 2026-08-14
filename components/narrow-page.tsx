import { appFrame, cn } from "@/lib/utils";

export function NarrowPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn(appFrame, "py-10", className)}>
      <div className="mx-auto max-w-md">{children}</div>
    </main>
  );
}
