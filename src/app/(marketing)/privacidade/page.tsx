import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidade — FechaZap" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold">Privacidade</h1>
      <p className="mt-6 text-muted-foreground">
        Contas usam Supabase Auth. Orçamentos, clientes e eventos ficam no
        Postgres com isolamento por prestador (RLS).
      </p>
      <p className="mt-4 text-muted-foreground">
        CPF do aceite é cifrado antes de gravar. Listagens expõem no máximo os
        quatro últimos dígitos. Arquivos (logo, contrato PDF) ficam em bucket
        privado, acessados por URL temporária.
      </p>
      <p className="mt-4 text-muted-foreground">
        Não vendemos lista de clientes. Tokens públicos de orçamento são
        aleatórios e não substituem senha.
      </p>
    </article>
  );
}
