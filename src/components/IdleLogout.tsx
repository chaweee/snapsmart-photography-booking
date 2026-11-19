import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabase";
import { useToast } from "../lib/toast";
import "./ConfirmDialog.css";

// Every signed-in user (admin, team, client) is logged out after 15 minutes
// without mouse, keyboard, scroll or touch activity. A warning appears 1 minute before.
const IDLE_LIMIT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;
// Shared across tabs so activity in one open tab keeps the others signed in too.
const STORAGE_KEY = "snapsmart-last-activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "scroll"] as const;

const readLastActivity = () => {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writeLastActivity = (time: number) => {
  try { window.localStorage.setItem(STORAGE_KEY, String(time)); } catch { /* storage unavailable: this tab still tracks in memory */ }
};

/** Logs the user out after 15 minutes of inactivity, with a 60-second warning first. */
export default function IdleLogout() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const signedIn = Boolean(session);

  const lastActivity = useRef(0);
  const lastWrite = useRef(0);
  const loggingOut = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warningOpen = secondsLeft !== null;
  const stayButton = useRef<HTMLButtonElement>(null);

  // While the warning is open, moving the mouse shouldn't silently dismiss it.
  const warningOpenRef = useRef(false);
  useEffect(() => { warningOpenRef.current = warningOpen; }, [warningOpen]);

  const markActive = useCallback((force = false) => {
    const now = Date.now();
    lastActivity.current = now;
    // Write at most every 5 seconds; mousemove fires constantly.
    if (force || now - lastWrite.current > 5000) {
      lastWrite.current = now;
      writeLastActivity(now);
    }
  }, []);

  const logOut = useCallback(async () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    setSecondsLeft(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    // Leave protected pages first so their login guard doesn't redirect to /login.
    navigate("/", { replace: true });
    const { error } = await supabase.auth.signOut();
    loggingOut.current = false;
    if (error) showToast("Couldn't log you out automatically. Please log out manually.", { type: "error" });
    else showToast("You were logged out after 15 minutes of inactivity.", { type: "info", durationMs: 8000 });
  }, [navigate, showToast]);

  // Track activity while signed in.
  useEffect(() => {
    if (!signedIn) return;
    // Reopening the site after being away longer than the limit logs out right away.
    // A fresh sign-in has no stored time yet, so it starts the timer now.
    const stored = readLastActivity();
    if (stored && Date.now() - stored >= IDLE_LIMIT_MS) { void logOut(); return; }
    lastActivity.current = stored || Date.now();
    writeLastActivity(lastActivity.current);

    const onActivity = () => { if (!warningOpenRef.current) markActive(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) lastActivity.current = Math.max(lastActivity.current, Number(event.newValue) || 0);
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true, capture: true }));
    window.addEventListener("storage", onStorage);
    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity, { capture: true }));
      window.removeEventListener("storage", onStorage);
    };
  }, [signedIn, markActive, logOut]);

  // Check once a second: show the warning, count down, then log out.
  useEffect(() => {
    if (!signedIn) return;
    const check = () => {
      // Pick up activity from other tabs.
      lastActivity.current = Math.max(lastActivity.current, readLastActivity());
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_LIMIT_MS) { void logOut(); return; }
      if (idle >= IDLE_LIMIT_MS - WARNING_MS) setSecondsLeft(Math.ceil((IDLE_LIMIT_MS - idle) / 1000));
      else setSecondsLeft(null);
    };
    const timer = window.setInterval(check, 1000);
    // Coming back to a tab after the computer slept: check right away.
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [signedIn, logOut]);

  useEffect(() => { if (warningOpen) stayButton.current?.focus(); }, [warningOpen]);

  const staySignedIn = () => {
    markActive(true);
    setSecondsLeft(null);
  };

  if (!signedIn || !warningOpen) return null;
  return createPortal(
    <div className="confirm-backdrop">
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" aria-describedby="idle-message">
        <h2 id="idle-title">Are you still there?</h2>
        <p id="idle-message">For your security, you'll be logged out in <strong>{secondsLeft}</strong> {secondsLeft === 1 ? "second" : "seconds"} because there has been no activity for a while.</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={() => void logOut()}>Log out now</button>
          <button ref={stayButton} type="button" className="confirm-ok" onClick={staySignedIn}>Stay signed in</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
