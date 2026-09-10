import {
  type FormEvent,
  type MouseEvent,
  type TouchEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatPeso, photographyPackages } from "../data/packages";
import "./BookingPage.css";

const photographers = [
  "No Preference",
  "Toni Villacoba",
  "Photographer A",
  "Photographer B",
];

const videographers = ["No Preference", "Videographer A", "Videographer B"];

function BookingPage() {
  const isClientLoggedIn =
    localStorage.getItem("snapsmartMockUser") === "client";
  const [selectedPackageId, setSelectedPackageId] = useState(
    photographyPackages[0].id,
  );
  const [eventType, setEventType] = useState("Wedding");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [message, setMessage] = useState("");

  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSigningRef = useRef(false);

  const selectedPackage = useMemo(
    () =>
      photographyPackages.find((item) => item.id === selectedPackageId) ??
      photographyPackages[0],
    [selectedPackageId],
  );

  const requiredDownPayment = selectedPackage.requiredDownPayment;
  const remainingBalance = selectedPackage.price - requiredDownPayment;

  const getCanvasPoint = (
    event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startSignature = (
    event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    isSigningRef.current = true;

    const point = getCanvasPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const drawSignature = (
    event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isSigningRef.current) {
      return;
    }

    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const point = getCanvasPoint(event);

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#29221e";
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopSignature = () => {
    isSigningRef.current = false;
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage(
      "Booking request submitted. The booking will remain pending until the down payment proof is verified by the admin.",
    );
  };

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
                Choose your package, provide your event details, select your
                preferred photographer or videographer, review the booking
                agreement, sign electronically, and submit your down payment
                proof for verification.
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
                      selectedPackageId === item.id
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
              <section className="booking-form-section">
                <div className="form-section-heading">
                  <p className="booking-eyebrow">STEP 2</p>
                  <h2>Client information</h2>
                </div>

                <div className="booking-field-grid">
                  <label className="booking-field">
                    <span>Full Name</span>
                    <input
                      name="clientName"
                      type="text"
                      placeholder="Enter client's full name"
                      required
                    />
                  </label>

                  <label className="booking-field">
                    <span>Email Address</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="client@example.com"
                      required
                    />
                  </label>

                  <label className="booking-field">
                    <span>Phone Number</span>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="09XX XXX XXXX"
                      required
                    />
                  </label>

                  <label className="booking-field">
                    <span>Address</span>
                    <input
                      name="address"
                      type="text"
                      placeholder="Client address"
                    />
                  </label>
                </div>
              </section>

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
                      <option>Special Event</option>
                    </select>
                  </label>

                  <label className="booking-field">
                    <span>Event Date</span>
                    <input name="eventDate" type="date" required />
                  </label>

                  <label className="booking-field">
                    <span>Start Time</span>
                    <input name="startTime" type="time" required />
                  </label>

                  <label className="booking-field">
                    <span>End Time</span>
                    <input name="endTime" type="time" required />
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

                  <label className="booking-field full">
                    <span>Event Location</span>
                    <input
                      name="eventLocation"
                      type="text"
                      placeholder="Venue / complete event location"
                      required
                    />
                  </label>

                  <label className="booking-field full">
                    <span>Additional Notes</span>
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
                  <h2>Preferred team</h2>
                </div>

                <div className="booking-field-grid">
                  {selectedPackage.requiresPhotographer && (
                    <label className="booking-field">
                      <span>Photographer</span>

                      <select name="photographer" required>
                        {photographers.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {selectedPackage.requiresVideographer && (
                    <label className="booking-field">
                      <span>Videographer</span>

                      <select name="videographer" required>
                        {videographers.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <p className="booking-helper-text">
                  Team availability will be checked against confirmed bookings
                  and blocked schedules once Supabase is connected.
                </p>
              </section>

              <section className="booking-form-section">
                <div className="form-section-heading">
                  <p className="booking-eyebrow">STEP 5</p>
                  <h2>Booking Agreement</h2>
                </div>

                <label className="agreement-box">
                  <input name="agreement" type="checkbox" required />

                  <span>
                    I confirm that the booking information is correct. I agree
                    that this request will only be confirmed after the required
                    down payment has been verified by the admin. I also agree to
                    Toni Photography&apos;s booking terms, payment requirements,
                    cancellation policy, and privacy terms.
                  </span>
                </label>

                <div className="client-signature-box">
                  <div className="client-signature-heading">
                    <div>
                      <span>Client E-Signature</span>
                      <strong>Sign inside the box</strong>
                    </div>

                    <button type="button" onClick={clearSignature}>
                      Clear Signature
                    </button>
                  </div>

                  <canvas
                    ref={signatureCanvasRef}
                    width={820}
                    height={220}
                    className="signature-canvas"
                    onMouseDown={startSignature}
                    onMouseMove={drawSignature}
                    onMouseUp={stopSignature}
                    onMouseLeave={stopSignature}
                    onTouchStart={startSignature}
                    onTouchMove={drawSignature}
                    onTouchEnd={stopSignature}
                  />

                  <p>
                    This signature will be attached to the booking agreement.
                    Once the booking is confirmed, the signed agreement can be
                    viewed inside My Bookings.
                  </p>
                </div>
              </section>

              <section className="booking-form-section">
                <div className="form-section-heading">
                  <p className="booking-eyebrow">STEP 6</p>
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

                <div className="exact-payment-alert">
                  <strong>Send exact down payment amount only.</strong>
                  <p>
                    Please send exactly {formatPeso(requiredDownPayment)}. If
                    the amount is lower, the booking will stay pending until the
                    remaining amount is submitted and verified.
                  </p>
                </div>

                <div className="client-payment-reference">
                  <div className="client-payment-preview">
                    {paymentMethod === "GCash" ? (
                      <>
                        <div className="mock-gcash-qr">
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>

                        <strong>GCash QR Code</strong>
                        <p>Scan this QR and send the exact amount shown.</p>
                      </>
                    ) : (
                      <>
                        <div className="mock-bank-card">BANK</div>

                        <strong>Bank Transfer</strong>
                        <p>Use the account details shown beside this box.</p>
                      </>
                    )}
                  </div>

                  <div className="client-payment-details">
                    <div>
                      <span>Amount to Send</span>
                      <strong>{formatPeso(requiredDownPayment)}</strong>
                    </div>

                    <div>
                      <span>Payment For</span>
                      <strong>{selectedPackage.name}</strong>
                    </div>

                    {paymentMethod === "GCash" ? (
                      <>
                        <div>
                          <span>GCash Account Name</span>
                          <strong>Toni Photography</strong>
                        </div>

                        <div>
                          <span>GCash Number</span>
                          <strong>09XX XXX XXXX</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span>Bank Name</span>
                          <strong>Sample Bank</strong>
                        </div>

                        <div>
                          <span>Account Name</span>
                          <strong>Toni Photography</strong>
                        </div>

                        <div>
                          <span>Account Number</span>
                          <strong>0000 0000 0000</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="booking-field-grid">
                  <label className="booking-field full">
                    <span>Payment Method</span>

                    <select
                      name="paymentMethod"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      required
                    >
                      <option>GCash</option>
                      <option>Bank Transfer</option>
                    </select>
                  </label>

                  <div className="booking-field full">
                    <span>Payment Proof</span>

                    <div className="file-upload-box">
                      <input
                        id="paymentProof"
                        name="paymentProof"
                        type="file"
                        accept="image/*,.pdf"
                        className="file-upload-input"
                      />

                      <div className="file-upload-icon">↑</div>

                      <div className="file-upload-copy">
                        <strong>Upload payment proof</strong>
                        <p>PNG, JPG, or PDF file accepted</p>
                      </div>

                      <label
                        htmlFor="paymentProof"
                        className="file-upload-button"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                </div>

                <div className="payment-instructions">
                  <strong>{paymentMethod} Instructions</strong>

                  <p>
                    Send the exact required down payment, then upload your
                    payment proof. The admin will verify the amount before the
                    booking is confirmed.
                  </p>
                </div>
              </section>

              <div className="booking-submit-area">
                <button type="submit">Submit Booking Request</button>

                <p>
                  Booking status will start as pending. It becomes confirmed
                  only after the down payment is verified by the admin.
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