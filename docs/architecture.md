# Arquitetura backend-first

## Responsabilidades

- **Vercel:** ambiente de produção de todo o produto: Next.js App Router, frontend futuro, Route Handlers/backend, validação, autenticação e criptografia do CPF.
- **Supabase:** Auth, Postgres, RLS, transações RPC e trilha imutável de eventos.
- **Cloudflare:** exclusivamente Workers e R2. O bucket `fechazap-files` deve permanecer privado; acesso externo será por URL assinada ou pelo Worker de arquivos. Não usar Pages, D1 ou KV neste projeto.
- **Mercado Pago:** adaptador futuro em `payments.provider = mercado_pago`; V1 usa `manual_pix`, conforme o plano.

## Arquivos e Workers

- R2 guarda logos, anexos, contratos e PDFs usando prefixos por prestador (`providers/<user-id>/...`).
- Metadados e autorização continuam no Postgres; R2 não é fonte de verdade do negócio.
- O backend na Vercel emite autorização curta para upload/download. Nenhuma credencial S3 chega ao navegador.
- Um Worker será criado somente junto do primeiro fluxo real de arquivo para validar assinatura, tamanho, MIME e chave/prefixo.
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

1. CRUD completo de itens do orçamento e recálculo transacional do total.
2. Geração determinística de contrato/PDF e armazenamento privado.
3. Oferta/seleção de horários com prevenção de conflito.
4. Turnstile e rate limiting nas duas rotas públicas.
5. Webhook idempotente do Mercado Pago, apenas após validar demanda por parcelamento.
6. Testes locais de integração contra Supabase e contrato OpenAPI.
