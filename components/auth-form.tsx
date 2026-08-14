"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { appFrame } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

export function AuthForm({ mode }: { mode: "login" | "cadastro" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    (requestedNext?.startsWith("/app") ||
      requestedNext?.startsWith("/dashboard")) &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/app";
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    const parsed = schema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError("Informe e-mail válido e senha com pelo menos 12 caracteres.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp({
            ...parsed.data,
            options: { emailRedirectTo: `${window.location.origin}/onboarding` },
          });
    setPending(false);
    if (result.error) {
      setError(
        mode === "login"
          ? "Não foi possível entrar. Confira e-mail e senha."
          : "Não foi possível criar a conta.",
      );
      return;
    }
    if (mode === "cadastro" && !result.data.session) {
      setConfirmationSent(true);
      return;
    }
    router.replace(mode === "cadastro" ? "/onboarding" : next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={`${appFrame} flex flex-1 flex-col justify-center py-16`}>
      <div className="mx-auto w-full max-w-md">
      <p className="font-mono text-sm tracking-widest text-primary uppercase">
        FechaZap
      </p>
      <h1 className="mt-4 text-3xl font-semibold">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
      {confirmationSent ? (
        <div className="mt-8 rounded-xl border bg-card p-5" role="status">
          <h2 className="font-semibold">Confirme seu e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação. Abra-o no mesmo navegador para
            continuar o cadastro com segurança.
          </p>
        </div>
      ) : (
      <form action={onSubmit} className="mt-8 grid gap-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Senha" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={12}
          />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="accent" size="lg" className="h-11" disabled={pending}>
          {pending ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </Button>
      </form>
      )}
      {mode === "login" ? (
        <p className="mt-3 text-sm">
          <Link href="/recuperar-senha" className="text-primary underline">
            Esqueci a senha
          </Link>
        </p>
      ) : null}
      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Novo por aqui?{" "}
            <Link href="/criar-conta" className="text-primary underline">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href="/entrar" className="text-primary underline">
              Entrar
            </Link>
            . Ao criar a conta você aceita os{" "}
            <Link href="/termos" className="underline">
              termos
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline">
              privacidade
            </Link>
            .
          </>
        )}
      </p>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
