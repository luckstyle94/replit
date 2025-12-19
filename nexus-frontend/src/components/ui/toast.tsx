import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type ToastVariant = "success" | "info" | "error" | "warning";

type ToastItem = {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
};

type ToastApi = {
  show: (toast: Omit<ToastItem, "id">) => void;
  success: (message: string, opts?: { title?: string }) => void;
  info: (message: string, opts?: { title?: string }) => void;
  warning: (message: string, opts?: { title?: string }) => void;
  error: (message: string, opts?: { title?: string }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function randomId() {
  return Math.random().toString(16).slice(2);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = randomId();
      setToasts((current) => [{ id, ...toast }, ...current].slice(0, 4));
      window.setTimeout(() => remove(id), toast.variant === "error" ? 6500 : 4200);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, opts) => show({ variant: "success", message, title: opts?.title }),
      info: (message, opts) => show({ variant: "info", message, title: opts?.title }),
      warning: (message, opts) => show({ variant: "warning", message, title: opts?.title }),
      error: (message, opts) => show({ variant: "error", message, title: opts?.title }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant}`}>
            <div className="toast-content">
              {t.title ? <div className="toast-title">{t.title}</div> : null}
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-close" type="button" onClick={() => remove(t.id)} aria-label="Fechar">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

