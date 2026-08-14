import Link from "next/link";
import { appFrame } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className={`${appFrame} grid gap-8 py-10 md:grid-cols-[1fr_auto_auto]`}>
        <div>
          <p className="font-heading text-lg font-semibold">FechaZap</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Página de serviços + funil de fechamento. Sem marketplace, sem app
            pro cliente.
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-medium">Produto</p>
          <Link href="/preview" className="text-muted-foreground hover:text-foreground">
            Preview
          </Link>
          <Link href="/precos" className="text-muted-foreground hover:text-foreground">
            Preços
          </Link>
          <Link href="/beleza" className="text-muted-foreground hover:text-foreground">
            Beleza
          </Link>
          <Link href="/reforma" className="text-muted-foreground hover:text-foreground">
            Reforma
          </Link>
          <Link href="/autonomos" className="text-muted-foreground hover:text-foreground">
            Autônomos
          </Link>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-medium">Conta</p>
          <Link href="/entrar" className="text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
          <Link href="/criar-conta" className="text-muted-foreground hover:text-foreground">
            Criar conta
          </Link>
          <Link href="/recuperar-senha" className="text-muted-foreground hover:text-foreground">
            Recuperar senha
          </Link>
          <Link href="/termos" className="text-muted-foreground hover:text-foreground">
            Termos
          </Link>
          <Link href="/privacidade" className="text-muted-foreground hover:text-foreground">
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
