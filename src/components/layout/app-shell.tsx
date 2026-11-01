import { OfflineStatusBar } from "@/components/offline/offline-status";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <OfflineStatusBar />
        {children}
      </main>
    </div>
  );
}
