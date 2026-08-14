const secured = { security: [{ bearerAuth: [] }] };
const response = (description: string) => ({
  responses: { "200": { description } },
});
const operation = (summary: string, securedRoute = false, status = "200") => ({
  summary,
  ...(securedRoute ? secured : {}),
  responses: {
    [status]: { description: "Sucesso" },
    "400": { description: "Requisição inválida" },
    "401": { description: "Não autorizado" },
  },
});

export function GET() {
  return Response.json({
    openapi: "3.1.0",
    info: {
      title: "FechaZap API",
      version: "1.0.0",
      description:
        "API backend-first para orçamentos, contratos, agenda, pagamentos, arquivos e assinaturas.",
    },
    servers: [{ url: "/api" }],
    paths: {
      "/health": { get: { ...response("Healthy"), summary: "Saúde da API" } },
      "/v1/public/{slug}": { get: operation("Consultar perfil público") },
      "/v1/public/{slug}/logo": {
        get: operation("Redirecionar logo pública"),
      },
      "/v1/public/{slug}/requests": {
        post: operation("Solicitar orçamento público"),
      },
      "/v1/public/quotes/{token}": {
        get: operation("Consultar orçamento público"),
      },
      "/v1/public/quotes/{token}/accept": {
        post: operation("Aceitar orçamento"),
      },
      "/v1/public/quotes/{token}/contract": {
        get: operation("Baixar contrato público"),
        post: operation("Aceitar contrato público"),
      },
      "/v1/public/quotes/{token}/appointments/{id}": {
        post: operation("Escolher horário"),
      },
      "/v1/provider/profile": {
        get: operation("Consultar perfil", true),
        put: operation("Atualizar perfil", true),
      },
      "/v1/provider/customers": {
        get: operation("Listar clientes", true),
        post: operation("Criar cliente", true, "201"),
      },
      "/v1/provider/customers/{id}": {
        delete: operation("Excluir cliente", true),
      },
      "/v1/provider/services": {
        get: operation("Listar serviços", true),
        post: operation("Criar serviço", true, "201"),
      },
      "/v1/provider/services/{id}": {
        patch: operation("Atualizar serviço", true),
        delete: operation("Excluir serviço", true),
      },
      "/v1/provider/quotes": {
        get: operation("Listar orçamentos", true),
        post: operation("Criar orçamento", true, "201"),
      },
      "/v1/provider/quotes/{id}": {
        get: operation("Detalhar orçamento", true),
        put: operation("Substituir itens e recalcular transacionalmente", true),
        patch: operation("Atualizar orçamento", true),
        delete: operation("Excluir orçamento", true),
      },
      "/v1/provider/quotes/{id}/transition": {
        post: operation("Alterar estado do orçamento", true),
      },
      "/v1/provider/quotes/{id}/contract": {
        post: operation("Gerar contrato PDF no R2", true, "201"),
      },
      "/v1/provider/quotes/{id}/appointments": {
        post: operation("Ofertar horários", true, "201"),
      },
      "/v1/provider/quotes/{id}/payments/manual": {
        post: operation("Confirmar PIX manualmente", true),
      },
      "/v1/provider/quotes/{id}/payments/mercado-pago": {
        post: operation("Criar cobrança PIX Mercado Pago", true, "201"),
      },
      "/v1/provider/files/upload-url": {
        post: operation("Criar URL de upload R2", true, "201"),
      },
      "/v1/provider/files/{id}": {
        get: operation("Criar URL de download R2", true),
        delete: operation("Excluir arquivo do R2", true),
      },
      "/v1/provider/subscription": {
        get: operation("Consultar assinatura", true),
        post: operation("Assinar plano FechaZap", true, "201"),
        delete: operation("Cancelar assinatura", true),
      },
      "/v1/provider/reminders/{id}/delivered": {
        post: operation("Marcar lembrete entregue", true),
      },
      "/webhooks/mercado-pago": {
        post: operation("Receber evento assinado do Mercado Pago"),
      },
      "/cron/reminders": {
        get: {
          summary: "Processar lembretes e links wa.me",
          security: [{ cronSecret: [] }],
          responses: {
            "200": { description: "Processado" },
            "401": { description: "Não autorizado" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        cronSecret: { type: "apiKey", in: "header", name: "Authorization" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
          required: ["error"],
        },
      },
    },
  });
}
