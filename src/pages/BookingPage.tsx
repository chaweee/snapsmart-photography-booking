import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  formatPeso,
  photographyPackages,
} from "../data/packages";
import "./BookingPage.css";

const photographers = [
  "No Preference",
  "Toni Villacoba",
  "Photographer A",
  "Photographer B",
];

const videographers = [
  "No Preference",
  "Videographer A",
  "Videographer B",
];

function BookingPage() {
  const [selectedPackageId, setSelectedPackageId] = useState(
    photographyPackages[0].id,
  );
  const [eventType, setEventType] = useState("Wedding");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [message, setMessage] = useState("");

  const selectedPackage = useMemo(
    () =>
      photographyPackages.find(
        (item) => item.id === selectedPackageId,
      ) ?? photographyPackages[0],
    [selectedPackageId],
  );

  const estimatedDownPayment = Math.ceil(selectedPackage.price * 0.3);
  const estimatedBalance =
    selectedPackage.price - estimatedDownPayment;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage(
      "Booking form is ready. Next, we will connect this to Supabase, payment proof upload, and e-signature storage.",
    );
  };

  return (
    <div className="booking-page">
      <Navbar isLoggedIn={false} />

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
                preferred photographer or videographer, e-sign the agreement,
                and submit your down payment proof for verification.
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
                <span>Estimated down payment</span>
                <strong>{formatPeso(estimatedDownPayment)}</strong>
              </div>

              <div className="summary-row">
                <span>Estimated remaining balance</span>
                <strong>{formatPeso(estimatedBalance)}</strong>
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

                      <small>{item.subtitle}</small>
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
                      onChange={(event) =>
                        setEventType(event.target.value)
                      }
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
                    <span>Booking Source</span>

                    <select name="bookingSource" required>
                      <option>Website</option>
                      <option>Walk-in</option>
                      <option>Facebook Messenger</option>
                      <option>Phone</option>
                      <option>Referral</option>
                      <option>Other</option>
                    </select>
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
                        <span>Bride's Full Name</span>
                        <input
                          name="brideName"
                          type="text"
                          placeholder="Enter bride's full name"
                          required
                        />
                      </label>

                      <label className="booking-field">
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
                  <h2>Agreement & e-signature</h2>
                </div>

                <label className="agreement-box">
                  <input name="agreement" type="checkbox" required />

                  <span>
                    I confirm that the booking information is correct and I
                    agree to Toni Photography's booking terms, payment
                    requirements, cancellation policy, and privacy terms.
                  </span>
                </label>

                <div className="signature-placeholder">
                  <span>E-Signature Area</span>
                  <p>
                    We will add a drawable signature pad here before connecting
                    the final booking submission.
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
                    <span>Estimated Down Payment</span>
                    <strong>{formatPeso(estimatedDownPayment)}</strong>
                  </div>

                  <div>
                    <span>Estimated Balance</span>
                    <strong>{formatPeso(estimatedBalance)}</strong>
                  </div>
                </div>

                <div className="booking-field-grid">
                  <label className="booking-field full">
                    <span>Payment Method</span>

                    <select
                      name="paymentMethod"
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(event.target.value)
                      }
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
                    Payment account details will come from the admin settings.
                    For now, this section is prepared for GCash and bank
                    transfer proof upload.
                  </p>
                </div>
              </section>

              <div className="booking-submit-area">
                <button type="submit">Submit Booking Request</button>

                <p>
                  Booking status will start as pending. It becomes confirmed
                  only after the down payment is verified by the admin.
                </p>

                {message && (
                  <div className="booking-message">{message}</div>
                )}
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