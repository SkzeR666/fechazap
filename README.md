# FechaZap API

Backend-first do FechaZap em Next.js App Router: página pública de serviços e funil de fechamento para profissionais autônomos. Este repositório ainda não contém frontend.

## Escopo do V1

- Supabase Auth + Postgres com isolamento multi-tenant por RLS
- perfil público e catálogo simples de serviços
- solicitação pública de orçamento
- funil auditável: pedido → orçamento → aceite → contrato → PIX → agenda → concluído
- aceite com CPF cifrado (AES-256-GCM), hash e evidências técnicas
- PIX manual; Mercado Pago fica apenas previsto no modelo de pagamentos
- Route Handlers do Next.js prontos para Vercel
- helpers Supabase SSR para browser, servidor e renovação de sessão via `proxy.ts`
- Cloudflare restrito a Workers e arquivos privados no R2

## Desenvolvimento

Requisitos: Node 20+, Docker (para Supabase local) e contas Supabase/Vercel quando for publicar.

```bash
npm install
# .env.local já contém apenas as chaves públicas fornecidas; complete os segredos server-side
npx supabase start
npm run db:reset
npm test
npm run dev
```

Gere `ACCEPTANCE_ENCRYPTION_KEY` sem imprimir ou versionar o valor. A variável deve conter 32 bytes em hexadecimal (64 caracteres). O arquivo `.env.local` é ignorado pelo Git.

## API inicial

| Método | Rota | Acesso | Uso |
|---|---|---|---|
| GET | `/api/health` | público | healthcheck |
| GET | `/api/v1/public/:slug` | público | perfil e serviços ativos |
| POST | `/api/v1/public/:slug/requests` | público | novo pedido |
| POST | `/api/v1/public/quotes/:token/accept` | token público | aceite do orçamento |
| PUT | `/api/v1/provider/profile` | Supabase JWT | cria/atualiza perfil |
| POST | `/api/v1/provider/services` | Supabase JWT | cria serviço |
| GET | `/api/v1/provider/quotes` | Supabase JWT | lista funil |
| POST | `/api/v1/provider/quotes` | Supabase JWT | cria fechamento direto |
| GET/PUT/DELETE | `/api/v1/provider/quotes/:id` | Supabase JWT | detalhe, itens transacionais e exclusão |
| POST | `/api/v1/provider/quotes/:id/transition` | Supabase JWT | muda status validando a máquina de estados |
| POST | `/api/v1/provider/quotes/:id/contract` | Supabase JWT | gera contrato PDF privado no R2 |
| POST | `/api/v1/provider/quotes/:id/appointments` | Supabase JWT | oferece horários |
| POST | `/api/v1/provider/quotes/:id/payments/manual` | Supabase JWT | confirma PIX manual |
| POST | `/api/v1/provider/quotes/:id/payments/mercado-pago` | Supabase JWT | cria cobrança PIX MP |
| GET/POST | `/api/v1/provider/subscription` | Supabase JWT | consulta/cria assinatura SaaS |
| POST | `/api/v1/provider/files/upload-url` | Supabase JWT | URL de upload R2 |
| GET/DELETE | `/api/v1/provider/files/:id` | Supabase JWT | download assinado/exclusão |
| POST | `/api/webhooks/mercado-pago` | assinatura MP | pagamento e assinatura idempotentes |
| GET | `/api/cron/reminders` | `CRON_SECRET` | lembretes diários e links WhatsApp |
| GET | `/api/openapi` | público | especificação OpenAPI 3.1 |

O header das rotas do prestador é `Authorization: Bearer <access_token>`.

As rotas públicas de pedido e aceite possuem rate limit persistente. O formulário de pedido valida Turnstile quando `CLOUDFLARE_TURNSTILE_SECRET_KEY` estiver configurada. Lembretes geram links `wa.me`; o V1 não envia mensagens automaticamente.

## Publicação segura

1. Crie o projeto no Supabase e rode `npx supabase link` e `npm run db:push`.
2. Importe o repositório na Vercel como **Next.js / App Router** e configure as variáveis de `.env.example`.
3. Hospede frontend e backend na Vercel; a API recebe o slug explicitamente.
4. No Cloudflare, use apenas Worker de arquivos + bucket R2 privado. Não use Pages, D1 ou KV para o FechaZap.
5. Só depois rode o servidor ou publique. Nunca use a service role no navegador.

Consulte [docs/architecture.md](docs/architecture.md) para decisões e próximos módulos.
