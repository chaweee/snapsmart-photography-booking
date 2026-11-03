import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  userId?: string;
  email?: string;
  authLoading: boolean;
}

export default function BookingClientInformation({ userId, email, authLoading }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(email ?? "");
  const [profileError, setProfileError] = useState(false);
  const changed = useRef({ name: false, phone: false });

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void supabase.from("profiles").select("full_name, phone").eq("id", userId).single().then(({ data, error }) => {
      if (!active) return;
      if (error || !data) {
        setProfileError(true);
        return;
      }
      if (!changed.current.name) setName(data.full_name ?? "");
      if (!changed.current.phone) setPhone(data.phone ?? "");
    });
    return () => { active = false; };
  }, [userId]);

  return (
    <section className="booking-form-section">
      <div className="form-section-heading">
        <p className="booking-eyebrow">STEP 2</p>
        <h2>Client information</h2>
      </div>
      {authLoading ? <p className="booking-helper-text">Loading account information...</p> : userId ? (
        <p className="booking-helper-text">Your account details are filled in below. You can edit them for this booking.</p>
      ) : (
        <p className="booking-helper-text">Log in with a client account to fill in your saved details automatically.</p>
      )}
      {profileError && <p className="booking-helper-text" role="alert">We could not load your profile. Please enter your details manually.</p>}
      <div className="booking-field-grid">
        <label className="booking-field">
          <span>Full Name</span>
          <input name="clientName" type="text" autoComplete="name" placeholder="Enter client's full name" required value={name} onChange={(event) => { changed.current.name = true; setName(event.target.value); }} />
        </label>
        <label className="booking-field">
          <span>Email Address</span>
          <input name="email" type="email" autoComplete="email" placeholder="client@example.com" required value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
        </label>
        <label className="booking-field">
          <span>Phone Number</span>
          <input name="phone" type="tel" autoComplete="tel" placeholder="09XX XXX XXXX" required value={phone} onChange={(event) => { changed.current.phone = true; setPhone(event.target.value); }} />
        </label>
        <label className="booking-field">
          <span>Address</span>
          <input name="address" type="text" autoComplete="street-address" placeholder="Client address" />
        </label>
      </div>
    </section>
  );
}
