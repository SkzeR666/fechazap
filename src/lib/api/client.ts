import type { QuoteStatus } from "@/src/domain/quote-state";
import type {
  ApiErrorBody,
  CreateQuoteInput,
  CustomerRow,
  ProfileInput,
  ProfileRow,
  PublicProfile,
  PublicQuote,
  QuoteDetail,
  QuoteListRow,
  QuoteRequestInput,
  QuoteRequestResult,
  QuoteRow,
  ReplaceQuoteItemsInput,
  ServiceInput,
  ServiceRow,
  SubscriptionRow,
  UploadUrlResult,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.error ?? `http_${status}`);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return undefined as T;
  const json = (await response
    .json()
    .catch(() => ({ error: "invalid_json" }))) as T | ApiErrorBody;
  if (!response.ok) throw new ApiError(response.status, json as ApiErrorBody);
  return json as T;
}

export const api = {
  public: {
    profile: (slug: string) =>
      request<PublicProfile>(`/api/v1/public/${encodeURIComponent(slug)}`),
    requestQuote: (slug: string, body: QuoteRequestInput) =>
      request<QuoteRequestResult>(
        `/api/v1/public/${encodeURIComponent(slug)}/requests`,
        { method: "POST", body },
      ),
    quote: (token: string) =>
      request<PublicQuote>(
        `/api/v1/public/quotes/${encodeURIComponent(token)}`,
      ),
    acceptQuote: (token: string, body: { name: string; cpf: string }) =>
      request<{ quoteId: string; status: QuoteStatus; acceptedAt: string }>(
        `/api/v1/public/quotes/${encodeURIComponent(token)}/accept`,
        { method: "POST", body },
      ),
    acceptContract: (token: string) =>
      request<{ id: string; status: QuoteStatus }>(
        `/api/v1/public/quotes/${encodeURIComponent(token)}/contract`,
        { method: "POST" },
      ),
    contractDownload: (token: string) =>
      request<{ downloadUrl: string; expiresIn: number }>(
        `/api/v1/public/quotes/${encodeURIComponent(token)}/contract`,
      ),
    selectAppointment: (token: string, appointmentId: string) =>
      request<{ appointmentId: string; startsAt: string; status: string }>(
        `/api/v1/public/quotes/${encodeURIComponent(token)}/appointments/${encodeURIComponent(appointmentId)}`,
        { method: "POST" },
      ),
  },
  provider: {
    profile: (token: string) =>
      request<{ data: ProfileRow | null }>("/api/v1/provider/profile", {
        token,
      }),
    saveProfile: (token: string, body: ProfileInput) =>
      request<ProfileRow>("/api/v1/provider/profile", {
        method: "PUT",
        token,
        body,
      }),
    customers: (token: string) =>
      request<{ data: CustomerRow[] }>("/api/v1/provider/customers", { token }),
    createCustomer: (
      token: string,
      body: { name: string; phone: string; email?: string },
    ) =>
      request<CustomerRow>("/api/v1/provider/customers", {
        method: "POST",
        token,
        body,
      }),
    deleteCustomer: (token: string, id: string) =>
      request<void>(`/api/v1/provider/customers/${encodeURIComponent(id)}`, {
        method: "DELETE",
        token,
      }),
    services: (token: string) =>
      request<{ data: ServiceRow[] }>("/api/v1/provider/services", { token }),
    createService: (token: string, body: ServiceInput) =>
      request<ServiceRow>("/api/v1/provider/services", {
        method: "POST",
        token,
        body,
      }),
    updateService: (token: string, id: string, body: Partial<ServiceInput>) =>
      request<ServiceRow>(
        `/api/v1/provider/services/${encodeURIComponent(id)}`,
        { method: "PATCH", token, body },
      ),
    deleteService: (token: string, id: string) =>
      request<void>(`/api/v1/provider/services/${encodeURIComponent(id)}`, {
        method: "DELETE",
        token,
      }),
    quotes: (token: string, status?: QuoteStatus) =>
      request<{ data: QuoteListRow[] }>(
        `/api/v1/provider/quotes${status ? `?status=${status}` : ""}`,
        { token },
      ),
    quote: (token: string, id: string) =>
      request<QuoteDetail>(
        `/api/v1/provider/quotes/${encodeURIComponent(id)}`,
        { token },
      ),
    createQuote: (token: string, body: CreateQuoteInput) =>
      request<QuoteRow>("/api/v1/provider/quotes", {
        method: "POST",
        token,
        body,
      }),
    replaceItems: (token: string, id: string, body: ReplaceQuoteItemsInput) =>
      request<QuoteRow>(`/api/v1/provider/quotes/${encodeURIComponent(id)}`, {
        method: "PUT",
        token,
        body,
      }),
    transition: (token: string, id: string, to: QuoteStatus, reason?: string) =>
      request<{ id: string; status: QuoteStatus }>(
        `/api/v1/provider/quotes/${encodeURIComponent(id)}/transition`,
        { method: "POST", token, body: { to, reason } },
      ),
    generateContract: (token: string, id: string) =>
      request<{ downloadUrl: string; expiresIn: number }>(
        `/api/v1/provider/quotes/${encodeURIComponent(id)}/contract`,
        { method: "POST", token },
      ),
    offerAppointments: (token: string, id: string, slots: string[]) =>
      request<{ data: AppointmentRowLike[] }>(
        `/api/v1/provider/quotes/${encodeURIComponent(id)}/appointments`,
        { method: "POST", token, body: { slots } },
      ),
    confirmManualPayment: (token: string, id: string) =>
      request<{ paymentId: string; quoteId: string; status: QuoteStatus }>(
        `/api/v1/provider/quotes/${encodeURIComponent(id)}/payments/manual`,
        { method: "POST", token },
      ),
    uploadUrl: (
      token: string,
      body: {
        kind: "brand" | "image" | "attachment" | "quote_pdf";
        contentType:
          "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
        fileName: string;
        quoteId?: string;
      },
    ) =>
      request<UploadUrlResult>("/api/v1/provider/files/upload-url", {
        method: "POST",
        token,
        body,
      }),
    subscription: (token: string) =>
      request<{ data: SubscriptionRow | null }>(
        "/api/v1/provider/subscription",
        { token },
      ),
    subscribe: (
      token: string,
      body: { plan: "solo" | "pro"; payerEmail: string },
    ) =>
      request<{
        subscriptionId: string;
        status: string;
        checkoutUrl: string;
      }>("/api/v1/provider/subscription", {
        method: "POST",
        token,
        body,
      }),
    cancelSubscription: (token: string) =>
      request<{ status: string }>("/api/v1/provider/subscription", {
        method: "DELETE",
        token,
      }),
  },
};

type AppointmentRowLike = {
  id: string;
  quote_id: string;
  starts_at: string;
  status: string;
};
