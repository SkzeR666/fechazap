import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function CadastroPage() {
  return (
    <Suspense>
      <AuthForm mode="cadastro" />
    </Suspense>
  );
}
