export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">Não encontrado</h1>
      <p className="mt-3 text-muted-foreground">
        Essa página não existe ou o link expirou.
      </p>
    </main>
  );
}
