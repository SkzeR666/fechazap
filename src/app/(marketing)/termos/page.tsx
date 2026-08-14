import type { Metadata } from "next";
import { appFrame } from "@/lib/utils";

export const metadata: Metadata = { title: "Termos — FechaZap" };

export default function TermsPage() {
  return (
    <article className={`${appFrame} py-16 text-sm leading-relaxed`}>
      <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold">Termos de uso</h1>
      <p className="mt-6 text-muted-foreground">
        O FechaZap hospeda a página do prestador e o funil de orçamento, aceite,
        contrato simples, PIX e agenda. Não é marketplace e não intermediamos a
        descoberta de clientes.
      </p>
      <p className="mt-4 text-muted-foreground">
        O aceite do cliente é um registro eletrônico (nome, CPF cifrado, horário
        e evidências técnicas). Não substitui assinatura digital com validade
        jurídica.
      </p>
      <p className="mt-4 text-muted-foreground">
        O plano grátis limita novos fechamentos no mês. Valores e
        disponibilidade dos planos Solo e Pro podem mudar com aviso na conta.
      </p>
      </div>
    </article>
  );
}
