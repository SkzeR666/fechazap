export const LOSS_REASONS = [
  { id: "desistiu", label: "Cliente desistiu" },
  { id: "preco", label: "Preço" },
  { id: "horario", label: "Horário" },
  { id: "sem_resposta", label: "Sem resposta" },
  { id: "outro_profissional", label: "Fechou com outro profissional" },
  { id: "outro", label: "Outro" },
] as const;

export type LossReasonId = (typeof LOSS_REASONS)[number]["id"];
