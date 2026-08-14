import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function EmptyState({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta?: string;
  href?: string;
}) {
  return (
    <Card className="grid max-w-lg gap-3 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      {cta && href ? (
        <Button asChild variant="accent" className="mt-2 w-fit">
          <Link href={href}>{cta}</Link>
        </Button>
      ) : null}
    </Card>
  );
}
