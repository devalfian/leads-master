export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="border-b border-border-subtle px-5 py-6 md:px-8">
        <div className="h-3 w-32 rounded bg-surface-elevated" />
        <div className="mt-3 h-6 w-64 rounded bg-surface-elevated" />
        <div className="mt-2 h-3 w-full max-w-xl rounded bg-surface-elevated" />
      </div>

      <div className="space-y-4 px-5 py-6 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-36 rounded-card border border-border-subtle bg-surface" />
          ))}
        </div>
        <div className="h-64 rounded-card border border-border-subtle bg-surface" />
      </div>
      <span className="sr-only">Loading workspace data…</span>
    </div>
  );
}