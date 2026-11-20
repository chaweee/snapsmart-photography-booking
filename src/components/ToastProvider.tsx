import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastOptions, type ToastType } from "../lib/toast";
import "./Toast.css";

type Toast = { id: number; message: string; type: ToastType; leaving: boolean };

const DEFAULT_DURATION: Record<ToastType, number> = { success: 4000, info: 4500, error: 7000 };
const MAX_TOASTS = 4;

/** App-wide toast messages, shown in the bottom-right corner (bottom on phones). */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, leaving: true } : toast));
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 200);
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const type = options.type ?? "success";
    const id = nextId.current++;
    setToasts((current) => {
      // Don't stack the exact same message twice in a row.
      const withoutDuplicate = current.filter((toast) => toast.message !== message);
      return [...withoutDuplicate, { id, message, type, leaving: false }].slice(-MAX_TOASTS);
    });
    timers.current.set(id, window.setTimeout(() => dismiss(id), options.durationMs ?? DEFAULT_DURATION[type]));
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach((timer) => window.clearTimeout(timer)); pending.clear(); };
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}${toast.leaving ? " toast-leaving" : ""}`} role={toast.type === "error" ? "alert" : "status"}>
            <span className="toast-icon" aria-hidden="true">{toast.type === "error" ? "!" : toast.type === "info" ? "i" : "✓"}</span>
            <p className="toast-message">{toast.message}</p>
            <button type="button" className="toast-close" aria-label="Dismiss message" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
