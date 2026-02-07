import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ToastProvider>
          <div className="flex min-h-screen items-center justify-center bg-background">
            {children}
          </div>
        </ToastProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
