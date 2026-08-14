"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, appFrame } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/preview", label: "Preview" },
  { href: "/precos", label: "Preços" },
  { href: "/ajuda", label: "Ajuda" },
];

export function SiteHeader({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className={cn(appFrame, "flex h-14 items-center justify-between")}>
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          FechaZap
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button asChild variant="accent">
            <Link href="/criar-conta">Criar fechamento</Link>
          </Button>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="size-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <SheetTitle>FechaZap</SheetTitle>
              <nav className="mt-6 grid gap-3 text-sm">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 grid gap-2">
                <Button asChild variant="outline">
                  <Link href="/entrar">Entrar</Link>
                </Button>
                <Button asChild variant="accent">
                  <Link href="/criar-conta">Criar fechamento</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
