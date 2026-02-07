import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RightPanel } from "@/components/layout/right-panel";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ToastProvider>
          <div className="mx-auto flex min-h-screen max-w-[1280px]">
            <Sidebar />
            <main className="min-h-screen flex-1 border-r border-border max-w-full sm:max-w-[600px] pb-16 lg:pb-0">
              {children}
            </main>
            <RightPanel />
          </div>
          <MobileNav />
        </ToastProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
