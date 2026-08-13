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
- Cloudflare recomendado para DNS, wildcard e Turnstile na borda

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
| POST | `/api/v1/provider/quotes/:id/transition` | Supabase JWT | muda status validando a máquina de estados |

O header das rotas do prestador é `Authorization: Bearer <access_token>`.

## Publicação segura

1. Crie o projeto no Supabase e rode `npx supabase link` e `npm run db:push`.
2. Importe o repositório na Vercel como **Next.js / App Router** e configure as variáveis de `.env.example`.
3. Configure `api.fechazap.com` na Vercel. Deixe `*.fechazap.com` para a futura aplicação pública; a API recebe o slug explicitamente.
4. No Cloudflare, habilite proxy, SSL Full (strict), WAF/rate limit e Turnstile no formulário público antes do tráfego real.
5. Só depois rode o servidor ou publique. Nunca use a service role no navegador.

Consulte [docs/architecture.md](docs/architecture.md) para decisões e próximos módulos.
