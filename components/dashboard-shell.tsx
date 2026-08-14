"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Menu,
  Palette,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Orçamentos", icon: LayoutDashboard },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Wrench },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
  { href: "/dashboard/marca", label: "Marca", icon: Palette },
  { href: "/dashboard/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard" || pathname.startsWith("/dashboard/orcamentos")
            : pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const profile = useProfile();

  useEffect(() => {
    if (profile.isFetched && !profile.data?.data) {
      router.replace("/onboarding");
    }
  }, [profile.data, profile.isFetched, router]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-card p-4 md:flex md:flex-col">
        <Link href="/dashboard" className="mb-6 font-heading text-xl font-semibold">
          FechaZap
        </Link>
        <NavLinks />
        <Button variant="ghost" className="mt-auto justify-start" onClick={signOut}>
          Sair
        </Button>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Link href="/dashboard" className="font-heading text-lg font-semibold">
            FechaZap
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="size-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetTitle className="mb-4">Menu</SheetTitle>
              <NavLinks />
              <Button variant="ghost" className="mt-6 w-full justify-start" onClick={signOut}>
                Sair
              </Button>
            </SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
