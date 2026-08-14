import type { QuoteStatus } from "@/src/domain/quote-state";

export type { QuoteStatus };

export type ApiErrorBody = {
  error: string;
  detail?: string;
  issues?: unknown;
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
};

export type PublicProfile = {
  slug: string;
  businessName: string;
  bio: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  whatsapp: string | null;
  showBranding: boolean;
  services: PublicService[];
};

export type QuoteRequestInput = {
  customer: { name: string; phone: string; email?: string };
  serviceId?: string;
  message?: string;
};

export type QuoteRequestResult = {
  id: string;
  publicToken: string;
  status: QuoteStatus;
};

export type PublicQuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type PublicQuote = {
  id: string;
  status: QuoteStatus;
  title: string | null;
  message: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  expiresAt: string | null;
  contractTerms: string | null;
  provider: {
    businessName: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string | null;
    pixKey: string | null;
    whatsapp: string | null;
    cancellationPolicy?: string | null;
  };
  customer: { name: string; phone?: string | null };
  items: PublicQuoteItem[];
  acceptance: { acceptedAt: string; accepterName: string } | null;
  appointments: Array<{
    id: string;
    startsAt: string;
    status: string;
  }>;
  payment: {
    status: string;
    provider: string;
    paidAt: string | null;
    pixCode: string | null;
    ticketUrl: string | null;
  } | null;
};

export type ProfileRow = {
  user_id: string;
  slug: string;
  business_name: string;
  display_name?: string | null;
  instagram?: string | null;
  document?: string | null;
  address?: string | null;
  service_modes?: string[] | null;
  cancellation_policy?: string | null;
  bio: string | null;
  logo_url: string | null;
  brand_color: string | null;
  whatsapp: string | null;
  pix_key: string | null;
  plan: "free" | "solo" | "pro";
  created_at: string;
  updated_at: string;
};

export type ProfileInput = {
  slug: string;
  businessName: string;
  displayName?: string;
  instagram?: string;
  document?: string;
  address?: string;
  serviceModes?: string[];
  cancellationPolicy?: string;
  bio?: string;
  logoUrl?: string;
  brandColor?: string;
  whatsapp?: string;
  pixKey?: string;
};

export type ServiceRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  duration_minutes: number | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ServiceInput = {
  name: string;
  description?: string;
  priceCents?: number | null;
  durationMinutes?: number | null;
  active?: boolean;
  sortOrder?: number;
};

export type AvailabilityRuleRow = {
  id: string;
  user_id: string;
  weekday: number;
  start_time: string | null;
  end_time: string | null;
  enabled: boolean;
};

export type AvailabilityExceptionRow = {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export type CustomerRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
};

export type QuoteItemRow = {
  id: string;
  quote_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  sort_order: number;
};

export type QuoteRow = {
  id: string;
  user_id: string;
  customer_id: string;
  public_token: string;
  status: QuoteStatus;
  title: string | null;
  message: string | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  expires_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
  contract_terms: string | null;
  contract_generated_at: string | null;
  loss_reason?: string | null;
};

export type QuoteListRow = QuoteRow & {
  customers: CustomerRow | CustomerRow[] | null;
  quote_items: QuoteItemRow[] | null;
  appointments?: AppointmentRow[] | null;
  quote_events?: QuoteEventRow[] | null;
};

export type QuoteEventRow = {
  id: number;
  quote_id: string;
  actor_id: string | null;
  event_type: string;
  from_status: QuoteStatus | null;
  to_status: QuoteStatus | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AcceptanceRow = {
  id: string;
  quote_id: string;
  accepter_name: string;
  cpf_last4: string;
  accepted_at: string;
};

export type PaymentRow = {
  id: string;
  quote_id: string;
  status: string;
  provider: string;
  amount_cents: number;
  paid_at: string | null;
  created_at: string;
};

export type AppointmentRow = {
  id: string;
  quote_id: string;
  starts_at: string;
  status: string;
  selected_at: string | null;
  created_at: string;
};

export type QuoteDetail = QuoteRow & {
  customers: CustomerRow | CustomerRow[] | null;
  quote_items: QuoteItemRow[] | null;
  acceptances: AcceptanceRow[] | null;
  payments: PaymentRow[] | null;
  appointments: AppointmentRow[] | null;
  quote_events: QuoteEventRow[] | null;
};

export type CreateQuoteInput = {
  customer: { name: string; phone: string; email?: string };
  title?: string;
  message?: string;
};

export type ReplaceQuoteItemsInput = {
  title: string;
  discountCents?: number;
  expiresAt?: string | null;
  items: Array<{
    serviceId?: string | null;
    description: string;
    quantity: number;
    unitPriceCents: number;
    sortOrder?: number;
  }>;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_reference: string | null;
  plan: "free" | "solo" | "pro";
  status: "pending" | "active" | "past_due" | "cancelled";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type UploadUrlResult = {
  upload: {
    objectKey: string;
    kind: "logo" | "image" | "attachment" | "quote_pdf";
    quoteId?: string;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  };
  uploadUrl: string;
  expiresIn: number;
};
