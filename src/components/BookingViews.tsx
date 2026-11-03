import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/authContext";
import "./BookingViews.css";

type Booking = { id: string; client_name: string; client_email: string | null; client_phone: string | null; client_address: string | null; package_id: string | null; package_snapshot: { name?: string; subtitle?: string; inclusions?: string[] } | null; event_type: string; other_event_type: string | null; event_date: string; start_time: string | null; end_time: string | null; event_location: string; church_location: string | null; theme_motif: string | null; bride_name: string | null; groom_name: string | null; notes: string | null; status: string; total_amount: number; required_down_payment: number; public_gallery_permission: boolean; preferred_photographer_id: string | null; preferred_videographer_id: string | null; is_test: boolean };
type TeamMember = { id: string; full_name: string };
type Payment = { id: string; amount: number; method: string; status: string };
const money = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
const dateLabel = (date: string) => { const [year, month, day] = date.split("-").map(Number); return new Date(year, month - 1, day).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }); };

function AdditionalPayment({ booking, remaining, onClose, onSubmitted }: { booking: Booking; remaining: number; onClose: () => void; onSubmitted: () => void }) {
  const { session } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<{ id: string; path: string; file: File; method: string; uploaded: boolean } | null>(null);
  const [method, setMethod] = useState("GCash");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy) return;
    if (!request.current) {
      const file = new FormData(event.currentTarget).get("proof");
      if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) { setError("Choose a JPEG, PNG, or PDF proof up to 5 MB."); return; }
      const id = crypto.randomUUID();
      const ext = file.type === "image/png" ? "png" : file.type === "application/pdf" ? "pdf" : "jpg";
      request.current = { id, path: `booking/${session.user.id}/${id}.${ext}`, file, method, uploaded: false };
      setLocked(true);
    }
    const item = request.current;
    if (!item.path.startsWith(`booking/${session.user.id}/`)) { setError("Account changed. Close this form and log in again."); return; }
    setBusy(true); setError("");
    try {
      if (!item.uploaded) {
        const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(item.path, item.file, { contentType: item.file.type, upsert: false });
        if (uploadError) {
          const { data: exists, error: existsError } = await supabase.storage.from("payment-proofs").exists(item.path);
          if (existsError || !exists) throw new Error(uploadError.message);
        }
        item.uploaded = true;
      }
      const { error: submitError } = await supabase.rpc("submit_additional_payment", { p_payment_id: item.id, p_booking_id: booking.id, p_method: item.method, p_proof_path: item.path });
      if (submitError) throw new Error(submitError.message);
      onSubmitted();
    } catch (failure) { setError(`${failure instanceof Error ? failure.message : "Could not submit payment."} Retry uses the same file; check the booking status before starting over.`); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="booking-agreement-dialog" aria-labelledby="additional-payment-title" onClose={onClose} onCancel={(event) => { if (busy) event.preventDefault(); }}><header><div><span>PAYMENT</span><h2 id="additional-payment-title">Submit another payment</h2></div><button type="button" aria-label="Close" disabled={busy} onClick={() => dialog.current?.close()}>×</button></header><form className="booking-agreement-body additional-payment-form" onSubmit={submit}><p>Remaining down payment: <strong>{money(remaining)}</strong>. If you have already sent a payment, do not send it again without checking with the administrator.</p><fieldset disabled={busy || locked}><label>Payment method<select value={method} onChange={(event) => setMethod(event.target.value)}><option>GCash</option><option>Bank Transfer</option></select></label><div className="additional-payment-qr"><img src={`${import.meta.env.BASE_URL}${method === "GCash" ? "GCASH%20QR.jpg" : "BANK%20QR.jpg"}`} alt={`${method} payment QR`} /><div><strong>{method}</strong><p>Account name: JHON CHARLIE VILLACOBA</p><p>Verify the recipient in your payment app.</p></div></div><label>Payment proof<input type="file" name="proof" accept="image/jpeg,image/png,application/pdf" required /><small>JPEG, PNG or PDF · maximum 5 MB</small></label></fieldset>{error && <p role="alert">{error}</p>}<button className="booking-view-primary" type="submit" disabled={busy}>{busy ? "Submitting..." : locked ? "Retry submission" : "Submit payment proof"}</button></form></dialog>;
}

function BookingDetails({ booking, isClient, onPaymentSubmitted }: { booking: Booking; isClient: boolean; onPaymentSubmitted: () => void }) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptDialog = useRef<HTMLDialogElement>(null);
  const receiptPaper = useRef<HTMLElement>(null);
  useEffect(() => { if (receiptOpen && receiptDialog.current && !receiptDialog.current.open) receiptDialog.current.showModal(); }, [receiptOpen]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamError, setTeamError] = useState(false);
  const [teamLoading, setTeamLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void supabase.rpc("list_booking_team").then(({ data, error }) => {
      if (!active) return;
      if (error) setTeamError(true); else setTeam((data ?? []) as TeamMember[]);
      setTeamLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    void supabase.from("payments").select("id,amount,method,status").eq("booking_id", booking.id).order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) setPaymentError(error.message); else setPayments(data ?? []);
      setPaymentLoading(false);
    });
    return () => { active = false; };
  }, [booking.id, booking.status]);
  const verified = payments.filter((payment) => payment.status === "Verified").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(Number(booking.required_down_payment) - verified, 0);
  const preference = (id: string | null) => !id ? "No preference" : teamLoading ? "Loading..." : teamError ? "Unable to load" : team.find((member) => member.id === id)?.full_name || "Unavailable team member";
  const fields: [string, string][] = [["Client", booking.client_name], ["Email", booking.client_email || "—"], ["Phone", booking.client_phone || "—"], ["Client address", booking.client_address || "—"], ["Event type", booking.event_type === "Special Event" && booking.other_event_type ? booking.other_event_type : booking.event_type], ["Date", dateLabel(booking.event_date)], ["Time", `${booking.start_time?.slice(0, 5) || "—"}${booking.end_time ? ` – ${booking.end_time.slice(0, 5)}` : ""}`], [booking.event_type === "Wedding" ? "Reception" : "Event location", booking.event_location], ...(booking.event_type === "Wedding" ? [["Church location", booking.church_location || "—"] as [string, string]] : []), ["Theme / motif", booking.theme_motif || "—"], ["Bride", booking.bride_name || "—"], ["Groom", booking.groom_name || "—"], ["Notes", booking.notes || "—"], ["Preferred photographer", preference(booking.preferred_photographer_id)], ["Preferred videographer", preference(booking.preferred_videographer_id)], ["Gallery permission", booking.public_gallery_permission ? "Public portfolio allowed" : "Private"], ["Total amount", money(Number(booking.total_amount))], ["Required down payment", money(Number(booking.required_down_payment))]];
  const [pdfError, setPdfError] = useState("");
  async function downloadReceipt() {
    setPdfError("");
    try {
      if (!receiptPaper.current) throw new Error("Receipt is unavailable.");
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
      const canvas = await html2canvas(receiptPaper.current, { scale: 2, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ unit: "mm", format: "a5" });
      const margin = 10;
      const availableWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const availableHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pdf.internal.pageSize.getWidth() - width) / 2, margin, width, height);
      pdf.save(`receipt-${booking.id}.pdf`);
    } catch {
      setPdfError("Could not download the PDF. Please try again.");
    }
  }
  return <aside className="booking-view-detail"><span className="booking-view-eyebrow">BOOKING DETAILS</span><h3>{booking.package_snapshot?.name || booking.package_id || "Package unavailable"}</h3><p>{booking.id}</p><div className="booking-view-badges"><span>{booking.status}</span>{booking.is_test && <span>TEST — not a real reservation</span>}</div><dl className="booking-view-detail-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="booking-view-payment"><h4>Payment records</h4>{paymentLoading ? <p>Loading payments...</p> : paymentError ? <p role="alert">Could not load payments: {paymentError}</p> : <><p>Verified total: <strong>{money(verified)}</strong>{booking.is_test && " (simulated)"}</p>{payments.length ? <ul>{payments.map((payment) => <li key={payment.id}>{payment.method} · {money(Number(payment.amount))} · {payment.status}</li>)}</ul> : <p>No payment records yet.</p>}</>}</div>
    {isClient && !booking.is_test && booking.status === "Payment Insufficient" && !paymentLoading && !paymentError && <div className="booking-payment-shortage"><strong>{payments.some((payment) => payment.status === "Rejected") ? "Payment proof needs attention" : "Additional payment needed"}</strong><p>Remaining down payment based on verified payments: {money(remaining)}. Submit a proof for admin review. If you already paid, contact the administrator before sending another payment.</p><button type="button" className="booking-view-primary" onClick={() => setAdditionalOpen(true)}>Send another payment</button></div>}
    {["Confirmed", "Completed"].includes(booking.status) ? <button className="booking-view-primary" type="button" disabled={paymentLoading || !!paymentError} onClick={() => setReceiptOpen(true)}>View contract receipt</button> : <p>Receipt will be available once the booking is confirmed.</p>}
    {receiptOpen && ["Confirmed", "Completed"].includes(booking.status) && <dialog ref={receiptDialog} className="booking-agreement-dialog receipt-dialog" aria-labelledby="receipt-title" onClose={() => setReceiptOpen(false)}>
      <header className="receipt-controls"><div><span>TONI PHOTOGRAPHY</span><h2>Contract receipt</h2></div><button type="button" aria-label="Close receipt" onClick={() => receiptDialog.current?.close()}>×</button></header>
      <div className="booking-agreement-body receipt-content">
        <article ref={receiptPaper} className="receipt-paper">
          <div className="receipt-brand"><span>TONI PHOTOGRAPHY</span><h2 id="receipt-title">Contract Receipt</h2><p>Booking &amp; payment summary</p></div>
          {booking.is_test && <p className="receipt-test"><strong>SIMULATION — not a real reservation or payment</strong></p>}
          <div className="receipt-reference"><span>BOOKING REFERENCE <strong>{booking.id}</strong></span><span>STATUS <strong>{booking.status}</strong></span></div>
          <section className="receipt-section"><h3>Client &amp; event</h3><dl className="receipt-details">{fields.filter(([label, value]) => !["Total amount", "Required down payment"].includes(label) && value !== "—" && value !== "No preference").map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
          <section className="receipt-section"><h3>Package summary</h3><div className="receipt-line receipt-item"><div><strong>{booking.package_snapshot?.name || "Package unavailable"}</strong>{booking.package_snapshot?.subtitle && <small>{booking.package_snapshot.subtitle}</small>}</div><strong>{money(Number(booking.total_amount))}</strong></div><div className="receipt-line"><span>Required down payment</span><span>{money(Number(booking.required_down_payment))}</span></div></section>
          <section className="receipt-section"><h3>{booking.is_test ? "Simulated verified payments" : "Verified payments"}</h3>{payments.some((payment) => payment.status === "Verified") ? payments.filter((payment) => payment.status === "Verified").map((payment) => <div className="receipt-line" key={payment.id}><span>{payment.method}</span><span>{money(Number(payment.amount))}</span></div>) : <p>No verified payment records available.</p>}<div className="receipt-line receipt-total"><span>Total verified payments</span><strong>{money(verified)}</strong></div></section>
          <div className="receipt-balance"><div><span>REMAINING BALANCE</span><small>Package price less verified payments</small></div><strong>{money(Math.max(Number(booking.total_amount) - verified, 0))}</strong></div>
          <p className="receipt-note">Pending or rejected payment proofs are not included. Please keep this receipt for your records.</p><p className="receipt-thanks">Thank you for choosing Toni Photography.</p>
        </article>
        <div className="receipt-actions receipt-controls"><button className="receipt-print-button" type="button" onClick={() => window.print()}>Print</button><button className="booking-view-primary" type="button" onClick={() => void downloadReceipt()}>Download PDF</button>{pdfError && <p role="alert">{pdfError}</p>}</div>
      </div>
    </dialog>}
    {additionalOpen && <AdditionalPayment booking={booking} remaining={remaining} onClose={() => setAdditionalOpen(false)} onSubmitted={() => { setAdditionalOpen(false); setPaymentLoading(true); onPaymentSubmitted(); }} />}
  </aside>;
}

export default function BookingViews({ mode }: { mode: "admin" | "client" | "calendar" }) {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedBooking = mode === "admin" ? searchParams.get("booking") : null;
  const userId = session?.user.id;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const [date, setDate] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      if (!userId) throw new Error("Please log in again.");
      if (mode === "client") {
        const { error: claimError } = await supabase.rpc("claim_walk_in_bookings");
        // Older deployments can still show existing bookings before this feature is installed.
        if (claimError && claimError.code !== "PGRST202") throw new Error(`Could not link walk-in bookings: ${claimError.message}`);
      }
      const all: Booking[] = [];
      for (let offset = 0; ; offset += 500) {
        let query = supabase.from("bookings").select("id,client_name,client_email,client_phone,client_address,package_id,package_snapshot,event_type,other_event_type,event_date,start_time,end_time,event_location,church_location,theme_motif,bride_name,groom_name,notes,status,total_amount,required_down_payment,public_gallery_permission,preferred_photographer_id,preferred_videographer_id,is_test");
        if (mode === "client") query = query.eq("client_id", userId);
        const { data, error: loadError } = await query.order("event_date", { ascending: false }).order("id").range(offset, offset + 499);
        if (loadError) throw loadError;
        all.push(...(data as Booking[]));
        if (data.length < 500) break;
      }
      return all;
    }
    void load().then((data) => { if (active) { setBookings(data); setSelected((current) => requestedBooking && data.some((booking) => booking.id === requestedBooking) ? requestedBooking : data.some((booking) => booking.id === current) ? current : data[0]?.id ?? ""); setError(""); setLoading(false); } }).catch((failure: unknown) => { if (active) { setError(failure instanceof Error ? failure.message : "Could not load bookings."); setLoading(false); } });
    return () => { active = false; };
  }, [mode, userId, reload, requestedBooking]);
  const current = bookings.find((booking) => booking.id === selected);
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const shown = mode === "calendar" ? bookings.filter((booking) => date ? booking.event_date === date : booking.event_date.startsWith(`${prefix}-`)).sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "")) : bookings;
  const weekdays = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return <section className={`booking-view-page${mode === "client" ? " client-bookings-page" : ""}`}><header className="booking-view-header"><div><p>{mode === "client" ? "CLIENT PORTAL" : "ADMIN WORKSPACE"}</p><h2>{mode === "calendar" ? "Booking calendar" : mode === "client" ? "My bookings" : "Bookings"}</h2><span>{mode === "calendar" ? "See your event schedule and open a booking for full details." : mode === "client" ? "Your moments, bookings, and payment updates in one place." : "View booking information from Supabase."}</span></div>{mode === "client" && bookings.length > 0 && <Link className="client-bookings-new" to="/book">+ New booking</Link>}</header>
    {notice && <p className="booking-view-notice" role="status">{notice}</p>}
    {error && <p role="alert">Could not load bookings: {error} <button type="button" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Retry</button></p>}
    {loading ? <p>Loading bookings...</p> : !error && <>
      {mode === "calendar" && <div className="booking-view-calendar"><div className="booking-view-calendar-header"><h3>{month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</h3><div><button type="button" aria-label="Previous month" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); setDate(""); }}>←</button><button type="button" aria-label="Next month" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); setDate(""); }}>→</button></div></div><div className="booking-view-calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <strong key={day}>{day}</strong>)}{Array.from({ length: weekdays }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1; const dayKey = `${prefix}-${String(day).padStart(2, "0")}`; const count = bookings.filter((item) => item.event_date === dayKey).length; return <button type="button" key={dayKey} aria-pressed={date === dayKey} aria-label={`${dayKey}: ${count} bookings`} className={`${count ? "has-bookings " : ""}${date === dayKey ? "selected" : ""}`} onClick={() => setDate(date === dayKey ? "" : dayKey)}><span>{day}</span>{count > 0 && <small>{count} {count === 1 ? "booking" : "bookings"}</small>}</button>; })}</div><p>Select a date to see its schedule; select it again to show the whole month.</p></div>}
      {mode === "calendar" ? <section className="booking-calendar-events"><div className="booking-calendar-events-heading"><div><span>EVENT SCHEDULE</span><h3>{date ? dateLabel(date) : month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</h3></div><strong>{shown.length} {shown.length === 1 ? "event" : "events"}</strong></div>{shown.length ? <div className="booking-calendar-event-list">{shown.map((booking) => <article key={booking.id} className="booking-calendar-event"><div><span>{booking.is_test ? "TEST · " : ""}{dateLabel(booking.event_date)} · {booking.start_time?.slice(0, 5) || "Time not set"}{booking.end_time ? ` – ${booking.end_time.slice(0, 5)}` : ""}</span><h4>{booking.other_event_type || booking.event_type} · {booking.client_name}</h4><p>{booking.event_location}</p><small>{booking.status}</small></div><Link to={`/admin/bookings?booking=${encodeURIComponent(booking.id)}`}>View booking →</Link></article>)}</div> : <div className="booking-view-empty"><strong>No events scheduled</strong><p>{date ? "There are no bookings on this date." : "There are no bookings in this month."}</p></div>}</section> : <div className={`booking-view-layout${mode === "client" && !shown.length ? " client-bookings-empty-layout" : ""}`}><div className="booking-view-list">{shown.length ? shown.map((booking) => <button key={booking.id} type="button" className={`booking-view-card${selected === booking.id ? " selected" : ""}`} onClick={() => { setSelected(booking.id); }}><span>{booking.is_test ? "TEST · " : ""}{dateLabel(booking.event_date)}</span><strong>{booking.package_snapshot?.name || booking.package_id || "Booking"}</strong><p>{booking.other_event_type || booking.event_type} · {booking.client_name}</p><small>{booking.status}</small></button>) : mode === "client" ? <div className="client-bookings-empty"><div className="client-bookings-empty-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><rect x="7" y="10" width="34" height="30" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M7 19h34M16 6v8M32 6v8M17 27h14M17 33h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div><span>YOUR NEXT CHAPTER</span><h3>No bookings yet</h3><p>Ready to make memories? Start your first booking and keep track of all the details here.</p><Link className="client-bookings-new" to="/book">Book a session <span aria-hidden="true">→</span></Link></div> : <div className="booking-view-empty"><strong>No bookings found</strong><p>Bookings will appear here when available.</p></div>}</div>{current && <BookingDetails key={current.id} booking={current} isClient={mode === "client"} onPaymentSubmitted={() => { setNotice("Payment proof submitted for admin review. Your booking is not yet confirmed."); setBookings((items) => items.map((item) => item.id === current.id ? { ...item, status: "Awaiting Payment Verification" } : item)); }} />}</div>}
    </>}
  </section>;
}
