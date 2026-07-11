export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 text-4xl mb-6">
          404
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}