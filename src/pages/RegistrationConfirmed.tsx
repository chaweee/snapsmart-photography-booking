import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./RegistrationConfirmed.css";

type Status = "checking" | "confirmed" | "unavailable";

export default function RegistrationConfirmed() {
  const [status, setStatus] = useState<Status>("checking");
  useEffect(() => {
    let active = true;
    async function checkConfirmation() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (active) setStatus(!error && data.user?.email_confirmed_at ? "confirmed" : "unavailable");
      } catch { if (active) setStatus("unavailable"); }
    }
    void checkConfirmation();
    return () => { active = false; };
  }, []);

  return <main className="confirmation-page"><section className="confirmation-card" aria-live="polite">
    <Link className="confirmation-brand" to="/">SNAPSMART <span>· TONI PHOTOGRAPHY</span></Link>
    {status === "checking" ? <><div className="confirmation-icon" aria-hidden="true">…</div><h1>Checking your email</h1><p>Please wait while we check your account.</p></> : status === "confirmed" ? <><div className="confirmation-icon" aria-hidden="true">✓</div><p className="confirmation-eyebrow">EMAIL VERIFIED</p><h1>Your email is confirmed</h1><p>Your email is confirmed and your account is ready. You can now explore packages and manage your bookings.</p><Link className="confirmation-button" to="/">Continue to SnapSmart <span aria-hidden="true">→</span></Link></> : <><div className="confirmation-icon confirmation-icon-error" aria-hidden="true">!</div><h1>We couldn't confirm your email</h1><p>The link may have expired or already been used, or we couldn't verify your session. Try logging in, or contact the studio if you need help.</p><Link className="confirmation-button" to="/login">Go to log in <span aria-hidden="true">→</span></Link></>}
  </section></main>;
}
