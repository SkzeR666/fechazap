import { finishAuthorization } from "@/src/modules/payments/mercado-pago/connect";
import { platformEnv } from "@/src/modules/platform/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const target = new URL("/dashboard/integracoes", platformEnv().APP_URL);
  try {
    if (!code || !state) throw new Error("missing_oauth_parameters");
    await finishAuthorization(code, state);
    target.searchParams.set("mercado_pago", "connected");
  } catch {
    target.searchParams.set("mercado_pago", "error");
  }
  return Response.redirect(target);
}
