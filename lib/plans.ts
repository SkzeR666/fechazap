export const PLANS = [
  {
    id: "free" as const,
    name: "Grátis",
    price: 0,
    period: "por mês",
    description: "Pra testar o funil com os primeiros clientes.",
    cta: "Começar grátis",
    href: "/cadastro",
    featured: false,
    features: [
      "3 fechamentos por mês",
      "Página pública com seus serviços",
      "Orçamento, aceite, PIX e agenda",
      'Marca "Feito com FechaZap"',
    ],
  },
  {
    id: "solo" as const,
    name: "Solo",
    price: 39,
    period: "por mês",
    description: "O plano de quem vive de serviço e quer fechar sem marca alheia.",
    cta: "Assinar Solo",
    href: "/cadastro?plano=solo",
    featured: true,
    features: [
      "Fechamentos ilimitados",
      "Página sem a marca FechaZap",
      "Contrato em PDF",
      "Lembretes no WhatsApp",
      "Modelos de contrato",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 79,
    period: "por mês",
    description: "Pra testar interesse — equipe, relatórios e multi-serviço avançado.",
    cta: "Quero o Pro",
    href: "/cadastro?plano=pro",
    featured: false,
    features: [
      "Tudo do Solo",
      "Multi-serviço avançado",
      "Funcionários e agenda de equipe",
      "Relatórios",
    ],
  },
] as const;

export const FAQS = [
  {
    q: "Preciso de cartão pra começar?",
    a: "Não. O plano grátis cobre 3 fechamentos no mês, com página pública e o funil completo.",
  },
  {
    q: "O cliente precisa baixar algum app?",
    a: "Não. Ele abre o seu link, vê os serviços, aceita o orçamento, paga no PIX e escolhe o horário no celular.",
  },
  {
    q: "Minha página fica em joao.fechazap.com?",
    a: "Não. O link público é o caminho no domínio, por exemplo fechazap.com/joao — não existe subdomínio por prestador.",
  },
  {
    q: "O PIX é automático?",
    a: "No V1 o PIX é a sua chave (QR + copia-e-cola). Você confirma o pagamento no dashboard. Integração Mercado Pago entra quando parcelamento virar pedido real.",
  },
  {
    q: "O aceite tem validade jurídica de assinatura digital?",
    a: "Não. Guardamos nome, CPF cifrado, horário e evidência técnica. É registro eletrônico, não e-CPF/ICP-Brasil.",
  },
  {
    q: "Serve pra equipe / vários funcionários?",
    a: "O V1 é feito pro autônomo. Equipe entra no Pro — a página existe pra medir interesse antes de construir.",
  },
];
