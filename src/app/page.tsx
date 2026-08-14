import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="font-mono text-sm tracking-widest text-primary uppercase">
        FechaZap
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Fecha o serviço. Sem enrolação.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Orçamento, contrato, PIX e agenda — um link só. O cliente aceita, paga e
        marca o horário.
      </p>
      <div className="mt-8 grid gap-3">
        <Button asChild variant="accent" size="lg" className="h-11">
          <Link href="/cadastro">Criar conta</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
