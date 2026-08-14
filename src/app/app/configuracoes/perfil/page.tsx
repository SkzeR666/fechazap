"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";

export default function AppProfileSettingsPage() {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePassword() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) toast.error("Não foi possível atualizar a senha.");
    else {
      toast.success("Senha atualizada.");
      setPassword("");
    }
  }

  return (
    <div className="max-w-lg grid gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/app/configuracoes">← Configurações</Link>
      </Button>
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <Field label="Nova senha">
        <Input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button
        variant="accent"
        disabled={saving || password.length < 8}
        onClick={() => void savePassword()}
      >
        {saving ? "Salvando..." : "Atualizar senha"}
      </Button>
    </div>
  );
}
