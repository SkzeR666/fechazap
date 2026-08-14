import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function CriarContaPage() {
  return (
    <Suspense>
      <AuthForm mode="cadastro" />
    </Suspense>
  );
}
