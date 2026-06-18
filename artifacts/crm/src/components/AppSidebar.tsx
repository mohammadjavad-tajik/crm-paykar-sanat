import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Briefcase, FileText, Settings, Lock, Menu, Truck, Cpu, PanelTop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLock } from "@/contexts/LockContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { name: "مشتریان", href: "/customers", icon: Users },
  { name: "کارها", href: "/jobs", icon: Briefcase },
  { name: "فاکتورها", href: "/invoices", icon: FileText },
  { name: "تامین‌کنندگان", href: "/suppliers", icon: Truck },
  { name: "تجهیزات", href: "/equipment", icon: Cpu },
  { name: "تابلوها", href: "/panels", icon: PanelTop },
  { name: "تنظیمات", href: "/settings", icon: Settings },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { lock } = useLock();

  return (
    <div className="flex h-full flex-col" style={{ background: "hsl(221 83% 53%)" }}>
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-white/10">
        <div>
          <div className="font-bold text-lg text-white leading-tight">پایکار صنعت</div>
          <div className="text-sm text-white/60 mt-0.5">سیستم مدیریت</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              data-testid={`nav-link-${item.name}`}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0 opacity-90" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Lock button */}
      <div className="shrink-0 p-3 border-t border-white/10">
        <button
          onClick={() => { onClose?.(); lock(); }}
          data-testid="button-lock"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Lock className="h-5 w-5 shrink-0" />
          قفل کردن
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 right-4 z-50 bg-white shadow-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-64 border-0">
          <NavContent onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 md:right-0">
        <NavContent />
      </div>
    </>
  );
}
