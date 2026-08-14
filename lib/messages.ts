export function interpolate(
  template: string,
  vars: Record<string, string>,
) {
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export const MESSAGE_TEMPLATES = {
  novaProposta:
    "Oi, {{cliente}}! Preparei os detalhes do seu atendimento. Você pode conferir e confirmar tudo pelo link abaixo:\n\n{{link}}",
  pagamentoPendente:
    "Oi, {{cliente}}! Passando para lembrar que sua reserva ainda aguarda o pagamento do sinal.\n\n{{link}}",
  agendamento:
    "Pagamento confirmado! Agora você já pode escolher seu horário:\n\n{{link}}",
  lembrete:
    "Oi, {{cliente}}! Só passando para lembrar do seu atendimento amanhã às {{hora}}.",
  duvida: "Oi! Tenho uma dúvida sobre o atendimento.",
} as const;
