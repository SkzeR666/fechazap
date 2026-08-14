"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    if (!email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/redefinir-senha`,
    });
    setPending(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="text-3xl font-semibold">Esqueci a senha</h1>
        {sent ? (
          <p className="mt-4 text-muted-foreground">
            Se o e-mail existir, você recebe o link pra redefinir a senha.
          </p>
        ) : (
          <form action={onSubmit} className="mt-8 grid gap-4">
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </Field>
            <Button
              type="submit"
              variant="accent"
              className="h-11"
              disabled={pending}
            >
              {pending ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Voltar ao login
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
