import { NarrowPage } from "@/components/narrow-page";

export default function NotFound() {
  return (
    <NarrowPage className="flex min-h-screen flex-col justify-center text-center">
      <h1 className="text-3xl font-semibold">Não encontrado</h1>
      <p className="mt-3 text-muted-foreground">
        Essa página não existe ou o link expirou.
      </p>
    </NarrowPage>
  );
}
