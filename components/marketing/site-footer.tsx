import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_auto_auto]">
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
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
          <Link href="/cadastro" className="text-muted-foreground hover:text-foreground">
            Criar conta
          </Link>
          <Link href="/esqueci-senha" className="text-muted-foreground hover:text-foreground">
            Esqueci a senha
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
