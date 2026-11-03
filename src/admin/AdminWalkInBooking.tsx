import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPeso, type PhotographyPackage } from "../data/packages";
import { supabase } from "../lib/supabase";
import "./Admin.css";

function AdminWalkInBooking() {
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [photographyPackages, setPhotographyPackages] = useState<PhotographyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [message, setMessage] = useState("");
  const [cash, setCash] = useState("0");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const guard = useRef(false);
  const request = useRef<{ id: string; payload: Record<string, unknown> } | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve(supabase.from("packages").select("id,name,subtitle,coverage_type,price,required_down_payment,inclusions,is_popular,requires_photographer,requires_videographer").eq("is_active", true).order("name")).then((packages) => {
      if (!active) return;
      if (packages.error) setLoadError(packages.error.message);
      else {
        setPhotographyPackages((packages.data ?? []).map((item) => ({ id: item.id, name: item.name, subtitle: item.subtitle, coverageType: item.coverage_type, price: Number(item.price), requiredDownPayment: Number(item.required_down_payment), inclusions: item.inclusions, isPopular: item.is_popular, requiresPhotographer: item.requires_photographer, requiresVideographer: item.requires_videographer })));
      }
      setLoading(false);
    }).catch(() => { if (active) { setLoadError("Unable to load booking data. Please try again."); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const selectedPackage = useMemo(
    () =>
      photographyPackages.find(
        (item) => item.id === selectedPackageId,
      ) ?? photographyPackages[0],
    [selectedPackageId, photographyPackages],
  );

  const downPayment = selectedPackage?.requiredDownPayment ?? 0;
  const remainingBalance = (selectedPackage?.price ?? 0) - downPayment;
  const cashIsValid = /^\d+(?:\.\d{1,2})?$/.test(cash) && Number(cash) <= (selectedPackage?.price ?? 0);
  const cashAmount = cashIsValid ? Number(cash) : 0;
  const downPaymentRemaining = Math.max(Math.round(downPayment * 100) - Math.round(cashAmount * 100), 0) / 100;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || saved || guard.current) return;
    const form = new FormData(event.currentTarget);
    if (!request.current) {
      const amountText = String(form.get("amountReceived") ?? "").trim();
      const amount = Number(amountText);
      if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount > selectedPackage.price) { setMessage("Enter the actual cash received using up to two decimal places, without commas."); return; }
      request.current = { id: crypto.randomUUID(), payload: {
        package_id: selectedPackage.id, client_name: String(form.get("clientName") ?? "").trim(), email: String(form.get("email") ?? "").trim(), phone: String(form.get("phone") ?? "").trim(), address: String(form.get("address") ?? "").trim(), event_type: eventType, other_event_type: String(form.get("otherEventType") ?? "").trim(), event_date: String(form.get("eventDate") ?? ""), start_time: String(form.get("startTime") ?? ""), event_location: String(form.get("eventLocation") ?? "").trim(), church_location: String(form.get("churchLocation") ?? "").trim(), theme_motif: String(form.get("themeMotif") ?? "").trim(), bride_name: String(form.get("brideName") ?? "").trim(), groom_name: String(form.get("groomName") ?? "").trim(), notes: String(form.get("notes") ?? "").trim(), cash_received: amount, cash_confirmed: form.get("paymentVerified") === "on", public_gallery_permission: form.get("publicGalleryPermission") === "on",
      } };
      setLocked(true);
    }
    guard.current = true; setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.rpc("create_walk_in_booking", { p_id: request.current.id, p_form: request.current.payload });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("The booking could not be confirmed saved.");
      setSaved(true);
      setMessage("Walk-in booking saved. The client can access it after signing up and verifying the same email address.");
    } catch (failure) { setMessage(`${failure instanceof Error ? failure.message : "Could not save the booking."} Retry uses the same request; check Bookings before starting another.`); }
    finally { guard.current = false; setBusy(false); }
  };

  if (loading || loadError || !selectedPackage) return <div className="admin-walkin-page"><h2>Create walk-in booking</h2><p role={loadError ? "alert" : "status"}>{loading ? "Loading packages..." : loadError ? `Could not load booking data: ${loadError}` : "No active packages are available yet."}</p></div>;

  return (
    <div className="admin-walkin-page">
      <section className="admin-page-heading">
        <div>
          <p>Walk-In Booking</p>
          <h2>Create walk-in booking</h2>
        </div>

        <div className="dashboard-actions">
          <Link to="/admin/bookings">View Bookings</Link>
          <Link to="/admin/calendar">Open Calendar</Link>
        </div>
      </section>

      <section className="walkin-layout">
        <form className="walkin-form" onSubmit={handleSubmit}>
          <fieldset className="walkin-form-fields" disabled={locked || busy || saved}>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 1</p>
                <h3>Client information</h3>
              </div>
            </div>

            <div className="walkin-field-grid">
              <label className="walkin-field">
                <span>Full Name</span>
                <input
                  name="clientName"
                  type="text"
                  placeholder="Enter client's full name"
                  required
                />
              </label>

              <label className="walkin-field">
                <span>Phone Number</span>
                <input
                  name="phone"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  required
                />
              </label>

              <label className="walkin-field">
                <span>Email Address</span>
                <input
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                  required
                />
              </label>

              <label className="walkin-field">
                <span>Address</span>
                <input
                  name="address"
                  type="text"
                  placeholder="Client address"
                />
              </label>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 2</p>
                <h3>Package selection</h3>
              </div>
            </div>

            <div className="walkin-package-grid">
              {photographyPackages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    selectedPackage.id === item.id
                      ? "walkin-package-card active"
                      : "walkin-package-card"
                  }
                  onClick={() => setSelectedPackageId(item.id)}
                >
                  <span>{item.subtitle}</span>
                  <strong>{item.name}</strong>
                  <b>{formatPeso(item.price)}</b>
                </button>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 3</p>
                <h3>Event information</h3>
              </div>
            </div>

            <div className="walkin-field-grid">
              <label className="walkin-field">
                <span>Event Type</span>

                <select
                  name="eventType"
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value)}
                  required
                >
                  <option>Wedding</option>
                  <option>Birthday</option>
                  <option>Debut</option>
                  <option>Christening</option>
                  <option value="Special Event">Other Event</option>
                </select>
              </label>

              {eventType === "Special Event" && <label className="walkin-field"><span>What kind of event?</span><input name="otherEventType" type="text" maxLength={150} required /></label>}

              <label className="walkin-field">
                <span>Event Date</span>
                <input name="eventDate" type="date" required />
              </label>

              <label className="walkin-field">
                <span>Start Time</span>
                <input name="startTime" type="time" required />
              </label>

              <label className="walkin-field full">
                <span>Theme / Motif</span>
                <input
                  name="themeMotif"
                  type="text"
                  placeholder="Example: Rustic garden, black and gold, pastel pink"
                />
              </label>

              {eventType === "Wedding" && (
                <>
                  <label className="walkin-field">
                    <span>Bride's Full Name</span>
                    <input
                      name="brideName"
                      type="text"
                      placeholder="Enter bride's full name"
                      required
                    />
                  </label>

                  <label className="walkin-field">
                    <span>Groom's Full Name</span>
                    <input
                      name="groomName"
                      type="text"
                      placeholder="Enter groom's full name"
                      required
                    />
                  </label>
                </>
              )}

              {eventType === "Wedding" && <label className="walkin-field full"><span>Church Location</span><input name="churchLocation" type="text" maxLength={500} placeholder="Church name and complete location" required /></label>}
              <label className="walkin-field full">
                <span>{eventType === "Wedding" ? "Reception" : "Event Location"}</span>
                <input
                  name="eventLocation"
                  type="text"
                  placeholder="Venue / complete event location"
                  required
                />
              </label>

              <label className="walkin-field full">
                <span>Additional Notes (optional)</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Special requests, event instructions, or other details"
                />
              </label>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 4</p>
                <h3>Payment collection</h3>
              </div>
            </div>

            <div className="walkin-payment-overview">
              <div>
                <span>Package Price</span>
                <strong>{formatPeso(selectedPackage.price)}</strong>
              </div>

              <div>
                <span>Required Down Payment</span>
                <strong>{formatPeso(downPayment)}</strong>
              </div>

              <div>
                <span>Remaining Balance</span>
                <strong>{formatPeso(remainingBalance)}</strong>
              </div>
            </div>

            <div className="walkin-field-grid">
              <label className="walkin-field">
                <span>Payment Method</span>

                <input name="paymentMethod" value="Cash" readOnly />
              </label>

              <label className="walkin-field">
                <span>Amount Received</span>
                <input
                  name="amountReceived"
                  type="text" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?"
                  value={cash} onChange={(event) => setCash(event.target.value)}
                  aria-describedby="walkin-cash-review"
                  required
                />
              </label>
            </div>

            <div className="walkin-cash-review" id="walkin-cash-review" aria-live="polite"><div><span>Cash to record</span><strong>{cashIsValid ? formatPeso(cashAmount) : "Enter a valid amount"}</strong></div><div><span>Down payment still needed</span><strong>{cashIsValid ? formatPeso(downPaymentRemaining) : "—"}</strong></div></div>

            <div className="walkin-payment-note">
              <strong>Cash payment</strong>
              <p>Enter only cash actually received. The booking is confirmed once the required down payment is met; otherwise it remains pending or insufficient.</p>
            </div>

            <label className="walkin-check">
              <input name="paymentVerified" type="checkbox" required={Number(cash) > 0} />

              <span>
                I confirm that the cash amount entered above has actually been received.
              </span>
            </label>

          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 5</p>
                <h3>Photo privacy</h3>
              </div>
            </div>

            <div className="walkin-payment-note">
              <strong>Photo privacy</strong>
              <p>Event photos are private by default. The client may optionally allow selected photos for portfolio, promotion, and marketing, online and offline. Permission does not automatically publish photos.</p>
              <label className="walkin-check"><input name="publicGalleryPermission" type="checkbox" /><span>Client permits selected event photos to be used for portfolio, promotion, and marketing, online and offline.</span></label>
            </div>

          </section>

          </fieldset>

          <div className="walkin-submit-area">
            <button type="submit" disabled={busy || saved}>{busy ? "Saving..." : saved ? "Booking saved" : locked ? "Retry submission" : "Save walk-in booking"}</button>

            <p>
              The client must sign up with this email and verify it to access the booking. Confirm the email carefully before saving.
            </p>

            {message && <div className="booking-message">{message}</div>}
          </div>
        </form>

        <aside className="admin-panel walkin-summary-panel">
          <div className="walkin-summary-header">
            <p>Booking Summary</p>
            <h3>{selectedPackage.name}</h3>
            <span>{selectedPackage.subtitle}</span>
          </div>

          <div className="walkin-summary-price">
            {formatPeso(selectedPackage.price)}
          </div>

          <div className="walkin-summary-list">
            <div>
              <span>Down Payment</span>
              <strong>{formatPeso(downPayment)}</strong>
            </div>

            <div>
              <span>Remaining Balance</span>
              <strong>{formatPeso(remainingBalance)}</strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>Cash</strong>
            </div>

            <div>
              <span>Initial Status</span>
              <strong>Not saved</strong>
            </div>
          </div>

          <div className="walkin-summary-inclusions">
            <h4>Package inclusions</h4>

            <ul>
              {selectedPackage.inclusions.map((inclusion) => (
                <li key={inclusion}>{inclusion}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AdminWalkInBooking;
