import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatPeso, type PhotographyPackage } from "../data/packages";
import "./BookingPage.css";
import { useAuth } from "../auth/authContext";
import BookingClientInformation from "./BookingClientInformation";
import { supabase } from "../lib/supabase";

function BookingPage() {
  const { session, role, loading } = useAuth();
  const isClientLoggedIn = !!session;
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [photographyPackages, setPhotographyPackages] = useState<PhotographyPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [paymentMethod, setPaymentMethod] = useState<"GCash" | "Bank Transfer">("GCash");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestLocked, setRequestLocked] = useState(false);
  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const proofInput = useRef<HTMLInputElement>(null);
  const submitGuard = useRef(false);
  const bookingRequest = useRef<{ id: string; path: string; file: File; payload: Record<string, unknown>; uploaded: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.from("packages").select("id,name,subtitle,coverage_type,price,required_down_payment,inclusions,is_popular,requires_photographer,requires_videographer").eq("is_active", true).order("name").then(({ data, error }) => {
      if (!active) return;
      if (error) setPackagesError(error.message);
      else setPhotographyPackages((data ?? []).map((item) => ({ id: item.id, name: item.name, subtitle: item.subtitle, coverageType: item.coverage_type, price: Number(item.price), requiredDownPayment: Number(item.required_down_payment), inclusions: item.inclusions, isPopular: item.is_popular, requiresPhotographer: item.requires_photographer, requiresVideographer: item.requires_videographer })));
      setPackagesLoading(false);
    });
    return () => { active = false; };
  }, []);

  const selectedPackage = useMemo(
    () =>
      photographyPackages.find((item) => item.id === selectedPackageId) ??
      photographyPackages[0],
    [selectedPackageId, photographyPackages],
  );

  const requiredDownPayment = selectedPackage?.requiredDownPayment ?? 0;
  const remainingBalance = (selectedPackage?.price ?? 0) - requiredDownPayment;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || submitted || submitGuard.current) return;
    if (!session || role !== "client") { setMessage("Log in using a client account to submit a booking request."); return; }
    if (bookingRequest.current && !bookingRequest.current.path.startsWith(`booking/${session.user.id}/`)) {
      bookingRequest.current = null;
      setRequestLocked(false);
      setMessage("Account changed. Please check your booking details and choose a payment proof again.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const file = data.get("paymentProof");
    if (!bookingRequest.current) {
      if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        setMessage("Choose a JPEG, PNG, or PDF payment proof up to 5 MB."); return;
      }
      if (!selectedPackage) { setMessage("Select an active package."); return; }
      const start = String(data.get("startTime") ?? "");
      if (!start) { setMessage("Please choose a start time."); return; }
    }
    submitGuard.current = true;
    setSubmitting(true); setRequestLocked(true); setMessage("");
    let stage = "preparing booking";
    try {
      if (!bookingRequest.current) {
        if (!(file instanceof File) || !selectedPackage) throw new Error("Booking details are missing.");
        const id = crypto.randomUUID();
        const extension = file.type === "image/png" ? "png" : file.type === "application/pdf" ? "pdf" : "jpg";
        bookingRequest.current = { id, path: `booking/${session.user.id}/${id}.${extension}`, file, uploaded: false, payload: {
          package_id: selectedPackage.id, client_name: String(data.get("clientName") ?? "").trim(), email: String(data.get("email") ?? "").trim(), phone: String(data.get("phone") ?? "").trim(), address: String(data.get("address") ?? "").trim(), event_type: eventType, other_event_type: eventType === "Special Event" ? String(data.get("otherEventType") ?? "").trim() : "", event_date: String(data.get("eventDate") ?? ""), start_time: String(data.get("startTime") ?? ""), event_location: String(data.get("eventLocation") ?? "").trim(), church_location: eventType === "Wedding" ? String(data.get("churchLocation") ?? "").trim() : "", theme_motif: String(data.get("themeMotif") ?? "").trim(), bride_name: String(data.get("brideName") ?? "").trim(), groom_name: String(data.get("groomName") ?? "").trim(), notes: String(data.get("notes") ?? "").trim(), payment_method: paymentMethod, consent: true, public_gallery_permission: data.get("publicGalleryPermission") === "on",
        } };
      }
      const request = bookingRequest.current;
      stage = "proof upload";
      if (!request.uploaded) {
        const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(request.path, request.file, { contentType: request.file.type, upsert: false });
        if (uploadError) {
          const { data: exists, error: existsError } = await supabase.storage.from("payment-proofs").exists(request.path);
          if (existsError || !exists) throw uploadError;
        }
        request.uploaded = true;
      }
      stage = "booking save";
      const { data: bookingId, error: submitError } = await supabase.rpc("submit_booking_with_preferences", { submission_id: request.id, form_data: request.payload, proof_path: request.path });
      if (submitError) throw new Error(submitError.message);
      if (!bookingId) throw new Error("The server did not return a booking ID.");
      setSubmitted(true);
      setMessage("Your booking has been submitted successfully!");
    } catch (failure) {
      setMessage(`Could not confirm submission (${stage}): ${failure instanceof Error ? failure.message : "Please try again."} Retry uses the same request; check My Bookings before starting another booking.`);
      if (!bookingRequest.current) setRequestLocked(false);
    } finally { submitGuard.current = false; setSubmitting(false); }
  };

  if (packagesLoading || packagesError || !selectedPackage) {
    return <div className="booking-page"><Navbar isLoggedIn={isClientLoggedIn} /><main className="booking-main"><section className="booking-content"><div className="booking-shell" role={packagesError ? "alert" : "status"}>{packagesLoading ? "Loading packages..." : packagesError ? `Could not load packages: ${packagesError}` : "No active packages are available yet."}</div></section></main></div>;
  }

  return (
    <div className="booking-page">
      <Navbar isLoggedIn={isClientLoggedIn} />

      <main className="booking-main">
        <section className="booking-hero">
          <div className="booking-shell booking-hero-layout">
            <div>
              <p className="booking-eyebrow">BOOK WITH TONI PHOTOGRAPHY</p>

              <h1>
                Reserve your date
                <span> with SNAPSMART.</span>
              </h1>

              <p>
                Choose your package, provide your event details, and submit your
                booking request and payment proof for admin review.
              </p>
            </div>

            <div className="booking-summary-card">
              <span>Selected Package</span>
              <strong>{selectedPackage.name}</strong>
              <p>{selectedPackage.subtitle}</p>

              <div className="booking-summary-price">
                {formatPeso(selectedPackage.price)}
              </div>

              <div className="summary-row">
                <span>Required down payment</span>
                <strong>{formatPeso(requiredDownPayment)}</strong>
              </div>

              <div className="summary-row">
                <span>Remaining balance</span>
                <strong>{formatPeso(remainingBalance)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="booking-content">
          <div className="booking-shell booking-layout">
            <aside className="booking-package-panel">
              <div className="panel-heading">
                <p className="booking-eyebrow">STEP 1</p>
                <h2>Choose a package</h2>
              </div>

              <div className="booking-package-list">
                {photographyPackages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      selectedPackage.id === item.id
                        ? "booking-package-option active"
                        : "booking-package-option"
                    }
                    onClick={() => setSelectedPackageId(item.id)}
                  >
                    <div>
                      <span>
                        {item.isPopular ? "Most Popular" : item.subtitle}
                      </span>

                      <strong>{item.name}</strong>

                      <small>
                        DP {formatPeso(item.requiredDownPayment)} •{" "}
                        {item.subtitle}
                      </small>
                    </div>

                    <b>{formatPeso(item.price)}</b>
                  </button>
                ))}
              </div>

              <div className="selected-inclusions">
                <h3>Package inclusions</h3>

                <ul>
                  {selectedPackage.inclusions.map((inclusion) => (
                    <li key={inclusion}>{inclusion}</li>
                  ))}
                </ul>
              </div>
            </aside>

              <form className="booking-form" onSubmit={handleSubmit}>
              <fieldset className="test-booking-fields" disabled={submitting || submitted || requestLocked}>
              <BookingClientInformation
                key={role === "client" ? session?.user.id : "guest"}
                userId={role === "client" ? session?.user.id : undefined}
                email={role === "client" ? session?.user.email : undefined}
                authLoading={loading}
              />

              <section className="booking-form-section">
                <div className="form-section-heading">
                  <p className="booking-eyebrow">STEP 3</p>
                  <h2>Event information</h2>
                </div>

                <div className="booking-field-grid">
                  <label className="booking-field">
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

                  {eventType === "Special Event" && <label className="booking-field">
                    <span>What kind of event?</span>
                    <input name="otherEventType" type="text" maxLength={150} placeholder="e.g. Graduation, anniversary" required />
                  </label>}

                  <label className="booking-field">
                    <span>Event Date</span>
                    <input name="eventDate" type="date" required />
                  </label>

                  <label className="booking-field">
                    <span>Start Time</span>
                    <input name="startTime" type="time" aria-describedby="coverage-time-note" required />
                    <small id="coverage-time-note" className="booking-time-note"><span aria-hidden="true">◷</span> Coverage continues until the program ends.</small>
                  </label>

                  <label className="booking-field full">
                    <span>Theme / Motif</span>
                    <input
                      name="themeMotif"
                      type="text"
                      placeholder="Example: Rustic garden, black and gold, pastel pink"
                    />
                  </label>

                  {eventType === "Wedding" && (
                    <>
                      <label className="booking-field">
                        <span>Bride&apos;s Full Name</span>
                        <input
                          name="brideName"
                          type="text"
                          placeholder="Enter bride's full name"
                          required
                        />
                      </label>

                      <label className="booking-field">
                        <span>Groom&apos;s Full Name</span>
                        <input
                          name="groomName"
                          type="text"
                          placeholder="Enter groom's full name"
                          required
                        />
                      </label>
                    </>
                  )}

                  {eventType === "Wedding" && <label className="booking-field full">
                    <span>Church Location</span>
                    <input name="churchLocation" type="text" maxLength={500} placeholder="Church name and complete location" required />
                  </label>}

                  <label className="booking-field full">
                    <span>{eventType === "Wedding" ? "Reception" : "Event Location"}</span>
                    <input
                      name="eventLocation"
                      type="text"
                      placeholder={eventType === "Wedding" ? "Reception venue / complete location" : "Venue / complete event location"}
                      required
                    />
                  </label>

                  <label className="booking-field full">
                    <span>Additional Notes (optional)</span>
                    <textarea
                      name="notes"
                      rows={4}
                      placeholder="Special requests, event instructions, or other details"
                    />
                  </label>
                </div>
              </section>

              <section className="booking-form-section">
                <div className="form-section-heading">
                  <p className="booking-eyebrow">STEP 4</p>
                  <h2>Photo Privacy</h2>
                </div>

                <div className="gallery-privacy-choice">
                  <div className="gallery-privacy-heading">
                    <span>PHOTO PRIVACY</span>
                    <h3>Choose how your photos may be shared</h3>
                    <p>Your event photos are private by default. This choice is optional.</p>
                  </div>
                  <label className="gallery-consent-option">
                    <input name="publicGalleryPermission" type="checkbox" />
                    <span>
                      <strong>Allow selected photos for portfolio, promotion, and marketing</strong>
                      <small>This includes online and offline use. If unchecked, your photos remain private and will not be used for these purposes. Permission does not automatically publish photos.</small>
                    </span>
                  </label>
                </div>

              </section>

              <section className="booking-form-section">
                <div className="form-section-heading">
                  <p className="booking-eyebrow">STEP 5</p>
                  <h2>Down payment</h2>
                </div>

                <div className="payment-overview">
                  <div>
                    <span>Package Price</span>
                    <strong>{formatPeso(selectedPackage.price)}</strong>
                  </div>

                  <div>
                    <span>Required Down Payment</span>
                    <strong>{formatPeso(requiredDownPayment)}</strong>
                  </div>

                  <div>
                    <span>Remaining Balance</span>
                    <strong>{formatPeso(remainingBalance)}</strong>
                  </div>
                </div>

                <p className="booking-helper-text">Please contact the administrator before sending payment. Uploading proof does not automatically confirm the payment or booking.</p>
                <label className="booking-field booking-payment-method">
                  <span>Payment Method</span>
                  <select name="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "GCash" | "Bank Transfer")}>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </label>
                <div className="client-payment-reference">
                  <div className="client-payment-preview">
                    <img className="booking-payment-qr" src={`${import.meta.env.BASE_URL}${paymentMethod === "GCash" ? "GCASH%20QR.jpg" : "BANK%20QR.jpg"}`} alt={`${paymentMethod} payment QR code`} />
                    <strong>{paymentMethod} QR</strong>
                    <p>Confirm the recipient in your payment app.</p>
                  </div>
                  <div className="client-payment-details">
                    <div><span>Account Name</span><strong>JHON CHARLIE VILLACOBA</strong></div>
                    <div><span>Payment Method</span><strong>{paymentMethod}</strong></div>
                    <div><span>Package</span><strong>{selectedPackage.name}</strong></div>
                    <div><span>Required Down Payment</span><strong>{formatPeso(requiredDownPayment)}</strong></div>
                  </div>
                </div>
                <div className="proof-upload-section">
                  <div className="proof-upload-heading"><div><span>PAYMENT VERIFICATION</span><h3>Upload your payment proof</h3><p>Attach your receipt or payment confirmation for admin review.</p></div><span className="proof-upload-required">Required</span></div>
                  <div className={`proof-upload-card${selectedProof && !proofError ? " has-file" : ""}${proofError ? " has-error" : ""}`}>
                    <input ref={proofInput} id="booking-payment-proof" className="proof-upload-input" name="paymentProof" type="file" accept="image/jpeg,image/png,application/pdf" required aria-describedby="proof-upload-help proof-upload-feedback" onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null;
                      const error = file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ? "Please choose a JPEG, PNG, or PDF file." : file && file.size > 5 * 1024 * 1024 ? "The file must be 5 MB or smaller." : file && file.size === 0 ? "Please choose a file that is not empty." : "";
                      event.currentTarget.setCustomValidity(error);
                      setSelectedProof(file);
                      setProofError(error);
                    }} />
                    <div className="proof-upload-icon" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg></div>
                    <div className="proof-upload-copy"><strong>{selectedProof ? selectedProof.name : "Choose a file to upload"}</strong><p id="proof-upload-help">{selectedProof ? `${(selectedProof.size / (1024 * 1024)).toFixed(2)} MB · ${selectedProof.type === "application/pdf" ? "PDF document" : "Image file"}` : "JPEG, PNG, or PDF · Maximum file size: 5 MB"}</p></div>
                    <div className="proof-upload-actions"><label htmlFor="booking-payment-proof" className="proof-upload-choose">{selectedProof ? "Change file" : "Choose file"}</label>{selectedProof && <button type="button" onClick={() => { if (proofInput.current) { proofInput.current.value = ""; proofInput.current.setCustomValidity(""); } setSelectedProof(null); setProofError(""); }}>Remove</button>}</div>
                  </div>
                  <p id="proof-upload-feedback" className={proofError ? "proof-upload-feedback error" : "proof-upload-feedback"} role="status">{proofError || (selectedProof ? "File selected. It will be uploaded when you submit your booking request." : "Your file is sent privately for admin review.")}</p>
                </div>
              </section>

              </fieldset>
              <div className="booking-submit-area">
                <button type="submit" disabled={submitting || submitted}>{submitting ? "Submitting..." : submitted ? "Request submitted" : "Submit booking request"}</button>

                <p>
                  By submitting, you acknowledge that your booking request is not confirmed until payment is verified. If submission fails, retry uses the same details and files.
                </p>

                {message && <div className="booking-message">{message}</div>}
              </div>

              <Link to="/" className="booking-back-link">
                ← Back to homepage
              </Link>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingPage;
