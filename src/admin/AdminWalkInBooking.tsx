import { FormEvent, useMemo, useState } from "react";
import { formatPeso, photographyPackages } from "../data/packages";
import "./Admin.css";

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

function AdminWalkInBooking() {
  const [selectedPackageId, setSelectedPackageId] = useState(
    photographyPackages[0].id,
  );
  const [eventType, setEventType] = useState("Wedding");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [message, setMessage] = useState("");

  const selectedPackage = useMemo(
    () =>
      photographyPackages.find(
        (item) => item.id === selectedPackageId,
      ) ?? photographyPackages[0],
    [selectedPackageId],
  );

  const downPayment = Math.ceil(selectedPackage.price * 0.3);
  const remainingBalance = selectedPackage.price - downPayment;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage(
      "Walk-in booking recorded successfully. Once connected to Supabase, this will create a confirmed booking and verified payment record.",
    );
  };

  return (
    <div className="admin-walkin-page">
      <section className="admin-page-heading">
        <div>
          <p>Walk-In Booking</p>
          <h2>Create walk-in booking</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button">View Bookings</button>
          <button type="button">Open Calendar</button>
        </div>
      </section>

      <section className="walkin-layout">
        <form className="walkin-form" onSubmit={handleSubmit}>
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
                  required
                />
              </label>

              <label className="walkin-field">
                <span>Email Address</span>
                <input
                  name="email"
                  type="email"
                  placeholder="client@example.com"
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
                    selectedPackageId === item.id
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
                  <option>Special Event</option>
                </select>
              </label>

              <label className="walkin-field">
                <span>Event Date</span>
                <input name="eventDate" type="date" required />
              </label>

              <label className="walkin-field">
                <span>Start Time</span>
                <input name="startTime" type="time" required />
              </label>

              <label className="walkin-field">
                <span>End Time</span>
                <input name="endTime" type="time" />
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

              <label className="walkin-field full">
                <span>Event Location</span>
                <input
                  name="eventLocation"
                  type="text"
                  placeholder="Venue / complete event location"
                  required
                />
              </label>

              <label className="walkin-field full">
                <span>Additional Notes</span>
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
                <h3>Assign preferred team</h3>
              </div>
            </div>

            <div className="walkin-field-grid">
              {selectedPackage.requiresPhotographer && (
                <label className="walkin-field">
                  <span>Photographer</span>

                  <select name="photographer" required>
                    {photographers.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
              )}

              {selectedPackage.requiresVideographer && (
                <label className="walkin-field">
                  <span>Videographer</span>

                  <select name="videographer" required>
                    {videographers.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <p className="walkin-helper">
              Later, this will check the selected team member’s availability
              before confirming the booking.
            </p>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 5</p>
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

                <select
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  required
                >
                  <option>Cash</option>
                  <option>GCash</option>
                  <option>Bank Transfer</option>
                </select>
              </label>

              <label className="walkin-field">
                <span>Amount Received</span>
                <input
                  name="amountReceived"
                  type="number"
                  min="0"
                  placeholder={`${downPayment}`}
                  required
                />
              </label>
            </div>

            {paymentMethod === "Cash" && (
              <div className="walkin-payment-note">
                <strong>Cash Payment</strong>
                <p>
                  Admin receives the cash payment and marks the down payment as
                  verified immediately.
                </p>
              </div>
            )}

            {paymentMethod === "GCash" && (
              <div className="walkin-qr-box">
                <div className="walkin-qr-placeholder">GCash QR</div>

                <div>
                  <strong>GCash Payment</strong>
                  <p>
                    Client scans the displayed QR code. Since this is a walk-in
                    transaction, admin can verify the payment immediately after
                    checking the confirmation screen.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === "Bank Transfer" && (
              <div className="walkin-qr-box">
                <div className="walkin-qr-placeholder">BANK</div>

                <div>
                  <strong>Bank Transfer</strong>
                  <p>
                    Admin provides the bank account or QR details. No upload is
                    required because the admin verifies the transaction on-site.
                  </p>
                </div>
              </div>
            )}

            <label className="walkin-check">
              <input name="paymentVerified" type="checkbox" required />

              <span>
                I confirm that the walk-in down payment has been received and
                verified.
              </span>
            </label>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p>Step 6</p>
                <h3>Agreement confirmation</h3>
              </div>
            </div>

            <label className="walkin-check">
              <input name="agreement" type="checkbox" required />

              <span>
                Client has reviewed and agreed to the booking terms, payment
                requirements, cancellation policy, and privacy terms.
              </span>
            </label>

            <div className="walkin-signature-box">
              <strong>Client E-Signature Area</strong>
              <p>
                Drawable signature pad will be added later. For now, this is the
                placeholder for the client’s walk-in agreement signature.
              </p>
            </div>
          </section>

          <div className="walkin-submit-area">
            <button type="submit">Create Confirmed Walk-In Booking</button>

            <p>
              This walk-in booking will be treated as confirmed once the admin
              records and verifies the down payment.
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
              <strong>{paymentMethod}</strong>
            </div>

            <div>
              <span>Initial Status</span>
              <strong>Confirmed</strong>
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