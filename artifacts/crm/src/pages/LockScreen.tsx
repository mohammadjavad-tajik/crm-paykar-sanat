import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useVerifyPin, useGetSettings } from "@workspace/api-client-react";
import { useLock } from "@/contexts/LockContext";
import { Lock, Delete } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPersianNumber } from "@/lib/utils";

const PIN_LENGTH = 4;

export default function LockScreen() {
  const [pin, setPin] = useState("");
  const { unlock } = useLock();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const verifyPin = useVerifyPin();
  const { data: settings } = useGetSettings();

  const doVerify = (code: string) => {
    verifyPin.mutate(
      { data: { pin: code } },
      {
        onSuccess: (result) => {
          if (result.valid) {
            unlock();
            setLocation("/dashboard");
          } else {
            toast({ title: "پین نادرست است", variant: "destructive" });
            setPin("");
          }
        },
        onError: () => {
          toast({ title: "خطا در بررسی پین", variant: "destructive" });
          setPin("");
        },
      }
    );
  };

  const handleNumberClick = (num: number) => {
    if (verifyPin.isPending) return;
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + num.toString();
      if (next.length === PIN_LENGTH) {
        setTimeout(() => doVerify(next), 50);
      }
      return next;
    });
  };

  const handleDelete = () => {
    if (verifyPin.isPending) return;
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-xs w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
            <Lock className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{settings?.business_name || "CRM فارسی"}</h1>
          <p className="text-muted-foreground text-sm">پین ۴ رقمی خود را وارد کنید</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 my-6">
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length ? "bg-primary border-primary scale-110" : "bg-transparent border-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={verifyPin.isPending || pin.length >= PIN_LENGTH}
              className="h-14 rounded-2xl bg-card border border-border text-xl font-semibold text-foreground hover:bg-accent hover:border-primary hover:text-primary transition-all duration-150 active:scale-95 disabled:opacity-50"
              data-testid={`button-pin-${num}`}
            >
              {formatPersianNumber(num)}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={pin.length === 0 || verifyPin.isPending}
            className="h-14 rounded-2xl bg-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-150 active:scale-95 disabled:opacity-30 flex items-center justify-center"
            data-testid="button-pin-delete"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleNumberClick(0)}
            disabled={verifyPin.isPending || pin.length >= PIN_LENGTH}
            className="h-14 rounded-2xl bg-card border border-border text-xl font-semibold text-foreground hover:bg-accent hover:border-primary hover:text-primary transition-all duration-150 active:scale-95 disabled:opacity-50"
            data-testid="button-pin-0"
          >
            {formatPersianNumber(0)}
          </button>
          <div className="h-14 flex items-center justify-center">
            {verifyPin.isPending && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
