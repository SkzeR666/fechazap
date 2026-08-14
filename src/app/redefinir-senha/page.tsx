"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { appFrame } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password.length < 12) {
      toast.error("A senha precisa ter pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      toast.error("Não foi possível redefinir. Peça um link novo.");
      return;
    }
    toast.success("Senha atualizada.");
    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={`${appFrame} flex flex-1 flex-col justify-center py-16`}>
        <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold">Nova senha</h1>
        <form action={onSubmit} className="mt-8 grid gap-4">
          <Field label="Nova senha" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar" htmlFor="confirm">
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </Field>
          <Button
            type="submit"
            variant="accent"
            className="h-11"
            disabled={pending}
          >
            {pending ? "Salvando..." : "Salvar senha"}
          </Button>
        </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
