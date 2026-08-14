"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function AuthForm({ mode }: { mode: "login" | "cadastro" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    const parsed = schema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError("Informe e-mail válido e senha com pelo menos 8 caracteres.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp(parsed.data);
    setPending(false);
    if (result.error) {
      setError(
        mode === "login"
          ? "Não foi possível entrar. Confira e-mail e senha."
          : "Não foi possível criar a conta.",
      );
      return;
    }
    router.replace(mode === "cadastro" ? "/onboarding" : next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="font-mono text-sm tracking-widest text-primary uppercase">
        FechaZap
      </p>
      <h1 className="mt-4 text-3xl font-semibold">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
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
            minLength={8}
          />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="accent" size="lg" className="h-11" disabled={pending}>
          {pending ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Novo por aqui?{" "}
            <Link href="/cadastro" className="text-primary underline">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="text-primary underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
