import { AppSidebar } from "./AppSidebar";
import { useLock } from "@/contexts/LockContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLocked } = useLock();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLocked && location !== "/lock") {
      setLocation("/lock");
    }
  }, [isLocked, location, setLocation]);

  if (isLocked) {
    return null; // Will redirect via effect
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 md:pr-60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8 mt-12 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
