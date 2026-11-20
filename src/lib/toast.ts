import { createContext, useContext, useEffect } from "react";

export type ToastType = "success" | "error" | "info";
export type ToastOptions = { type?: ToastType; durationMs?: number };
export type ShowToast = (message: string, options?: ToastOptions) => void;

export const ToastContext = createContext<ShowToast>(() => {});

/** Returns showToast(message, { type }) for the app-wide toast messages. */
export const useToast = () => useContext(ToastContext);

const ERROR_WORDS = /\b(could not|couldn't|cannot|can't|failed|failure|error|unable|invalid|must|missing|not allowed)\b/i;

/** Guesses success vs error from the message text (for pages that keep both in one message). */
export const toastTypeFor = (message: string): ToastType => (ERROR_WORDS.test(message) ? "error" : "success");

/**
 * Shows a page's display message as a toast, then clears it from the page.
 * Usage: useToastMessage(notice, setNotice) — keep calling setNotice("...") as before.
 */
export function useToastMessage(message: string, setMessage: (value: string) => void, type?: ToastType) {
  const showToast = useToast();
  useEffect(() => {
    if (!message) return;
    showToast(message, { type: type ?? toastTypeFor(message) });
    setMessage("");
  }, [message, setMessage, showToast, type]);
}
