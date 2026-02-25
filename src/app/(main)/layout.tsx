import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AiSummaryProvider } from "@/components/providers/ai-summary-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileComposeButton } from "@/components/layout/mobile-compose-button";
import { RightPanel } from "@/components/layout/right-panel";
import { BenefitsShowcase } from "@/components/layout/benefits-showcase";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <AiSummaryProvider>
          <ToastProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black">
            Skip to main content
          </a>
          <div className="mx-auto flex min-h-screen max-w-[1280px]">
            <Sidebar />
            <main id="main-content" className="min-h-screen flex-1 max-w-full sm:max-w-[600px] pb-16 lg:pb-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <RightPanel />
          </div>
          <BenefitsShowcase />
          <MobileComposeButton />
          <MobileNav />
          </ToastProvider>
        </AiSummaryProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
