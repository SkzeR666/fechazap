# FechaZap

Backend e frontend do FechaZap em Next.js App Router: orçamento, contrato, PIX e agenda.

## Serviços

- `src/app`: páginas públicas, dashboard e Route Handlers.
- `src/modules/auth`: autenticação e clientes Supabase com RLS.
- `src/modules/files`: hierarquia de objetos e URLs HMAC do Worker Cloudflare.
- `src/modules/payments`: API Orders, assinaturas e webhook do Mercado Pago.
- `src/modules/platform`: contratos estritos de configuração por serviço.
- `src/app/api`: camada HTTP fina implantada na Vercel.
- `cloudflare/files-worker`: serviço isolado que é o único acesso ao bucket R2 privado.

Não existem credenciais S3 na Vercel, aliases de variáveis, configuração Turnstile nem fallback entre segredos.

## Funcionalidades

- Supabase Auth, Postgres, RLS e isolamento multi-tenant.
- CRUD de serviços, clientes, orçamentos e itens.
- substituição transacional dos itens e recálculo do total.
- máquina de estados auditável do orçamento.
- aceite com CPF cifrado, hash e evidências técnicas.
- contrato e PDF armazenados no R2 privado.
- imagens, marcas e anexos organizados por usuário e cliente.
- PIX manual e PIX pela API Orders do Mercado Pago.
- assinatura e cancelamento dos planos do FechaZap.
- webhook Mercado Pago idempotente e restrito à aplicação FechaZap.
- oferta e escolha pública de horários.
- rate limit persistente no Postgres.
- cron de lembretes e links `wa.me`.
- OpenAPI 3.1 em `/api/openapi`.

## Desenvolvimento

Requisitos: Node.js 20+, Supabase CLI, Vercel CLI e Wrangler.

```bash
npm install
npx vercel env pull .env.local --environment=development --yes
npm run typecheck
npm run lint
npm test
npm run build
```

`.env.local` é ignorado pelo Git. A lista canônica de variáveis fica em `.env.example`.

## Rotas principais

| Método               | Rota                                                | Acesso                     |
| -------------------- | --------------------------------------------------- | -------------------------- |
| GET                  | `/api/health`                                       | público                    |
| GET                  | `/api/openapi`                                      | público                    |
| GET/PUT              | `/api/v1/provider/profile`                          | Supabase JWT               |
| GET                  | `/api/v1/provider/customers`                        | Supabase JWT               |
| GET/POST             | `/api/v1/provider/services`                         | Supabase JWT               |
| PATCH/DELETE         | `/api/v1/provider/services/:id`                     | Supabase JWT               |
| GET/POST             | `/api/v1/provider/quotes`                           | Supabase JWT               |
| GET/PUT/PATCH/DELETE | `/api/v1/provider/quotes/:id`                       | Supabase JWT               |
| POST                 | `/api/v1/provider/quotes/:id/transition`            | Supabase JWT               |
| POST                 | `/api/v1/provider/quotes/:id/contract`              | Supabase JWT               |
| POST                 | `/api/v1/provider/quotes/:id/appointments`          | Supabase JWT               |
| POST                 | `/api/v1/provider/quotes/:id/payments/manual`       | Supabase JWT               |
| POST                 | `/api/v1/provider/quotes/:id/payments/mercado-pago` | Supabase JWT               |
| GET/POST/DELETE      | `/api/v1/provider/subscription`                     | Supabase JWT               |
| POST                 | `/api/v1/provider/files/upload-url`                 | Supabase JWT               |
| GET/DELETE           | `/api/v1/provider/files/:id`                        | Supabase JWT               |
| GET                  | `/api/v1/public/:slug`                              | público                    |
| GET                  | `/api/v1/public/:slug/logo`                         | público                    |
| POST                 | `/api/v1/public/:slug/requests`                     | público + rate limit       |
| GET                  | `/api/v1/public/quotes/:token`                      | token público              |
| POST                 | `/api/v1/public/quotes/:token/accept`               | token público + rate limit |
| GET/POST             | `/api/v1/public/quotes/:token/contract`             | token público              |
| POST                 | `/api/v1/public/quotes/:token/appointments/:id`     | token público              |
| POST                 | `/api/webhooks/mercado-pago`                        | assinatura Mercado Pago    |
| GET                  | `/api/cron/reminders`                               | `CRON_SECRET`              |

## Infraestrutura

- Produção: `https://fechazap.vercel.app`
- Worker de arquivos: `https://fechazap-files.projectcore.workers.dev`
- Bucket: `fechazap-files` (privado)
- Hierarquia R2:
  - `users/<user-id>/brand/logos/`
  - `users/<user-id>/customers/<customer-id>/images/`
  - `users/<user-id>/customers/<customer-id>/attachments/`
  - `users/<user-id>/customers/<customer-id>/quotes/<quote-id>/pdfs/`
  - `users/<user-id>/customers/<customer-id>/quotes/<quote-id>/contracts/`

O webhook da FragBase pertence a outra aplicação Mercado Pago e não faz parte deste projeto.
