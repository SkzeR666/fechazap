import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
