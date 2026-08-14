export const PLANS = [
  {
    id: "free" as const,
    name: "Grátis",
    price: 0,
    period: "por mês",
    description: "Para testar o fluxo completo.",
    cta: "Começar grátis",
    href: "/criar-conta",
    featured: false,
    features: [
      "Até 3 fechamentos por mês",
      "Clientes e link sem cadastro",
      "Aceite e agendamento básico",
      'Marca "Feito com FechaZap"',
    ],
  },
  {
    id: "solo" as const,
    name: "Solo",
    price: 14.9,
    period: "por mês",
    description: "Para quem atende por conta própria.",
    cta: "Assinar Solo",
    href: "/criar-conta?plano=solo",
    featured: true,
    features: [
      "Fechamentos ilimitados",
      "Pagamentos e agenda",
      "Lembretes e catálogo de serviços",
      "Modelos e personalização",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 29.9,
    period: "por mês",
    description: "Para acompanhar e automatizar tudo.",
    cta: "Assinar Pro",
    href: "/criar-conta?plano=pro",
    featured: false,
    features: [
      "Tudo do Solo",
      "Relatórios e automações",
      "Página pública e solicitações",
      "Clientes recorrentes e exportação",
    ],
  },
] as const;

export const FAQS = [
  {
    q: "Preciso de cartão pra começar?",
    a: "Não. O plano grátis cobre 3 fechamentos no mês, com o funil completo: proposta, aceite, pagamento e agenda.",
  },
  {
    q: "O cliente precisa criar conta?",
    a: "Não. Ele recebe um link, confirma, paga e escolhe o horário no celular. Sem app, sem senha.",
  },
  {
    q: "Minha página fica em joao.fechazap.com?",
    a: "Não. O link permanente é fechazap.com/joao. O fechamento vai em fechazap.com/f/xxxx.",
  },
  {
    q: "O PIX é automático?",
    a: "No início o PIX é a sua chave (QR + copia-e-cola). Você confirma o pagamento no FechaZap. Mercado Pago entra quando fizer sentido.",
  },
  {
    q: "O aceite tem validade de assinatura digital?",
    a: "Não. Guardamos nome, CPF quando informado, horário e evidência técnica. É registro eletrônico, não e-CPF/ICP-Brasil.",
  },
  {
    q: "Serve pra equipe?",
    a: "O V1 é feito pro autônomo. Equipe e relatórios entram no Pro.",
  },
];
