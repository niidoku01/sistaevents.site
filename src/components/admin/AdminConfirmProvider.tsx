/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const AdminConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const close = useCallback((confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  }, [pending]);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setPending({ ...options, resolve });
  }), []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && close(false)}>
        <AlertDialogContent className="overflow-hidden border-white/50 bg-white/75 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-2xl sm:max-w-md">
          <div className={`h-1 w-full ${pending?.destructive ? "bg-gradient-to-r from-red-500 via-rose-400 to-amber-300" : "bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-300"}`} />
          <div className="p-6">
            <AlertDialogHeader className="text-left">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${pending?.destructive ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {pending?.destructive ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <AlertDialogTitle className="text-xl tracking-tight text-slate-900">{pending?.title}</AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed text-slate-600">{pending?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-2 sm:space-x-0">
              <AlertDialogCancel onClick={() => close(false)} className="mt-0 border-slate-200 bg-white/70 text-slate-700 hover:bg-white">{pending?.cancelLabel ?? "Cancel"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => close(true)}
                className={pending?.destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-slate-900 text-white hover:bg-slate-800"}
              >
                {pending?.confirmLabel ?? "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useAdminConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useAdminConfirm must be used inside AdminConfirmProvider");
  return context;
};
