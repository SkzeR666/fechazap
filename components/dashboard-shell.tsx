"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Calendar,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Users,
  Wallet,
  Wrench,
  FileStack,
  ClipboardList,
} from "lucide-react";
import { CommandMenu } from "@/components/command-menu";
import { NotificationsBell } from "@/components/notifications-bell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const PRIMARY = [
  { href: "/app", label: "Início", icon: LayoutDashboard },
  { href: "/app/fechamentos", label: "Fechamentos", icon: ClipboardList },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/financeiro", label: "Financeiro", icon: Wallet },
];

const CATALOG = [
  { href: "/app/servicos", label: "Serviços", icon: Wrench },
  { href: "/app/modelos", label: "Modelos", icon: FileStack },
];

const SETTINGS = [
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const groups = [PRIMARY, CATALOG, SETTINGS];
  return (
    <nav className="grid gap-4">
      {groups.map((group, index) => (
        <div key={index} className="grid gap-1">
          {index > 0 ? <Separator className="mb-2" /> : null}
          {group.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);
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
        </div>
      ))}
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
    router.replace("/entrar");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r bg-card p-4 md:flex md:flex-col">
          <Link href="/app" className="mb-4 font-heading text-xl font-semibold">
            FechaZap
          </Link>
          <Button asChild variant="accent" className="mb-6">
            <Link href="/app/novo">
              <Plus className="size-4" />
              Criar fechamento
            </Link>
          </Button>
          <NavLinks />
          <div className="mt-auto flex items-center justify-between gap-2">
            <Button variant="ghost" className="justify-start" onClick={signOut}>
              Sair
            </Button>
            <ThemeToggle />
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <Link href="/app" className="font-heading text-lg font-semibold md:hidden">
              FechaZap
            </Link>
            <p className="hidden text-sm text-muted-foreground md:block">
              {profile.data?.data?.business_name ?? "Seu negócio"}
            </p>
            <div className="ml-auto flex items-center gap-1">
              <CommandMenu />
              <NotificationsBell />
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="size-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <SheetTitle className="mb-4">Menu</SheetTitle>
                  <Button asChild variant="accent" className="mb-4 w-full">
                    <Link href="/app/novo">Criar fechamento</Link>
                  </Button>
                  <NavLinks />
                  <Button
                    variant="ghost"
                    className="mt-6 w-full justify-start"
                    onClick={signOut}
                  >
                    Sair
                  </Button>
                </SheetContent>
              </Sheet>
            </div>
          </header>
          <main className="w-full flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
