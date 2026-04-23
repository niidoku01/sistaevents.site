export const AppLoadingFallback = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
};
