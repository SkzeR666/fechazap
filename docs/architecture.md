# Arquitetura backend-first

## Responsabilidades

- **Vercel:** ambiente de produção de todo o produto: Next.js App Router, frontend futuro, Route Handlers/backend, validação, autenticação e criptografia do CPF.
- **Supabase:** Auth, Postgres, RLS, transações RPC e trilha imutável de eventos.
- **Cloudflare:** exclusivamente Worker de arquivos e R2. O bucket `fechazap-files` permanece privado e não há credenciais S3 na Vercel.
- **Mercado Pago:** adaptador futuro em `payments.provider = mercado_pago`; V1 usa `manual_pix`, conforme o plano.

## Arquivos e Workers

- R2 organiza objetos por `users/<user-id>/brand/logos` e `users/<user-id>/customers/<customer-id>/{images,attachments,quotes/<quote-id>/{pdfs,contracts}}`.
- Metadados e autorização continuam no Postgres; R2 não é fonte de verdade do negócio.
- O backend na Vercel emite autorização curta para upload/download. Nenhuma credencial S3 chega ao navegador.
- O Worker `fechazap-files` recebe URLs HMAC temporárias, valida expiração, método, MIME, limite de 15 MiB e prefixo `users/` antes de acessar o binding privado do R2.
- URLs públicas permanentes e `r2.dev` ficam desabilitados; documentos pessoais são sempre privados.
- Workers não processam pagamentos nem substituem os Route Handlers da Vercel.

## Limites de segurança

A service role só é usada pela API para operações públicas estritamente encapsuladas em RPC. Prestadores usam JWT do Supabase, e as políticas RLS comparam `auth.uid()` ao `user_id`. O CPF é cifrado antes do banco; listagens expõem no máximo os quatro últimos dígitos. Tokens públicos são UUIDs aleatórios e não substituem rate limit/Turnstile.

## Regras de domínio

- Plano grátis aceita no máximo três novos fechamentos no mês, aplicado dentro da transação do banco.
- Toda mudança de status passa por `transition_quote`; saltos no funil são rejeitados.
- Aceite só ocorre em orçamento enviado ou visualizado e ainda válido.
- Eventos registram ator, estado anterior, estado novo e horário.
- Valores monetários são inteiros em centavos.

## Próximos incrementos de backend

Implementado no backend: CRUD de serviços/orçamentos, troca transacional de itens e totais, contrato PDF, Worker/R2 privado, oferta/seleção de horários, PIX manual, PIX via Mercado Pago Orders, assinatura SaaS, webhook idempotente e isolado por aplicação, rate limit, OpenAPI, cron e links WhatsApp.
