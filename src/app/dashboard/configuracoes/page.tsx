"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";

export default function SettingsPage() {
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
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <Field label="Nova senha">
        <Input
          type="password"
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button
        variant="accent"
        disabled={saving || password.length < 12}
        onClick={savePassword}
      >
        {saving ? "Salvando..." : "Atualizar senha"}
      </Button>
    </div>
  );
}
