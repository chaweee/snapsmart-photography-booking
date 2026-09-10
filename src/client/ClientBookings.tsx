import { useMemo, useState } from "react";
import { clientBookings, type ClientBooking } from "./clientMockData";
import "./Client.css";

function ClientBookings() {
  const [selectedBookingId, setSelectedBookingId] = useState(
    clientBookings[0]?.id ?? "",
  );
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isAdditionalPaymentOpen, setIsAdditionalPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [paymentProofName, setPaymentProofName] = useState("");
  const [additionalPaymentMessage, setAdditionalPaymentMessage] = useState("");

  const selectedBooking = useMemo(
    () =>
      clientBookings.find((booking) => booking.id === selectedBookingId) ??
      clientBookings[0],
    [selectedBookingId],
  );

  const canViewAgreement =
    selectedBooking?.bookingStatus === "Confirmed" ||
    selectedBooking?.bookingStatus === "Completed";

  const getBookingStatusClass = (status: string) => {
    if (status === "Confirmed") return "confirmed";
    if (status === "Completed") return "completed";
    if (status === "Payment Insufficient") return "insufficient";
    if (status === "Cancelled") return "cancelled";
    if (status === "Awaiting Payment Verification") return "verification";
    return "pending";
  };

  const getPaymentStatusClass = (status: string) => {
    if (status === "Verified" || status === "Fully Paid") return "confirmed";
    if (status === "Insufficient") return "insufficient";
    if (status === "For Verification") return "verification";
    return "pending";
  };

  const handleSelectBooking = (booking: ClientBooking) => {
    setSelectedBookingId(booking.id);
    setIsAgreementOpen(false);
    setIsAdditionalPaymentOpen(false);
    setAdditionalPaymentMessage("");
  };

  const handleOpenAdditionalPayment = () => {
  setPaymentMethod("GCash");
  setPaymentProofName("");
  setAdditionalPaymentMessage("");
  setIsAdditionalPaymentOpen(true);
};

  const handleSubmitAdditionalPayment = (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  if (!paymentProofName) {
    setAdditionalPaymentMessage("Please upload your payment proof.");
    return;
  }

  setAdditionalPaymentMessage(
    "Additional payment proof submitted for admin verification.",
  );
};

  return (
    <section className="client-page">
      <div className="client-page-heading">
        <div>
          <p>Client Portal</p>
          <h2>My Bookings</h2>
        </div>
      </div>

      <div className="client-bookings-layout">
        <div className="client-booking-list">
          {clientBookings.map((booking) => (
            <button
              type="button"
              key={booking.id}
              className={
                selectedBookingId === booking.id
                  ? "client-booking-card active"
                  : "client-booking-card"
              }
              onClick={() => handleSelectBooking(booking)}
            >
              <div className="client-booking-card-top">
                <span>{booking.id}</span>
                <strong>{booking.eventDate}</strong>
              </div>

              <h3>{booking.packageName}</h3>

              <p>
                {booking.eventType} • {booking.eventTime}
              </p>

              <div className="client-booking-card-statuses">
                <span
                  className={`client-status ${getBookingStatusClass(
                    booking.bookingStatus,
                  )}`}
                >
                  {booking.bookingStatus}
                </span>

                <span
                  className={`client-status ${getPaymentStatusClass(
                    booking.paymentStatus,
                  )}`}
                >
                  {booking.paymentStatus}
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedBooking && (
          <aside className="client-booking-details">
            <div className="client-detail-header">
              <span>{selectedBooking.id}</span>
              <h3>{selectedBooking.packageName}</h3>
              <p>
                {selectedBooking.eventType} event scheduled on{" "}
                {selectedBooking.eventDate}.
              </p>
            </div>

            <div className="client-detail-badges">
              <span
                className={`client-status ${getBookingStatusClass(
                  selectedBooking.bookingStatus,
                )}`}
              >
                {selectedBooking.bookingStatus}
              </span>

              <span
                className={`client-status ${getPaymentStatusClass(
                  selectedBooking.paymentStatus,
                )}`}
              >
                {selectedBooking.paymentStatus}
              </span>
            </div>

            {selectedBooking.paymentStatus === "Insufficient" &&
              selectedBooking.shortageAmount && (
                <div className="client-warning-box">
                  <strong>Additional payment needed</strong>
                  <p>
                    Your down payment is short by{" "}
                    <b>{selectedBooking.shortageAmount}</b>. Please submit an
                    additional payment proof for verification.
                  </p>
                </div>
              )}

            <div className="client-detail-grid">
              <div>
                <span>Event Date</span>
                <strong>{selectedBooking.eventDate}</strong>
              </div>

              <div>
                <span>Event Time</span>
                <strong>{selectedBooking.eventTime}</strong>
              </div>

              <div>
                <span>Event Location</span>
                <strong>{selectedBooking.eventLocation}</strong>
              </div>

              <div>
                <span>Theme / Motif</span>
                <strong>{selectedBooking.themeMotif}</strong>
              </div>

              <div>
                <span>Photographer</span>
                <strong>{selectedBooking.photographer}</strong>
              </div>

              <div>
                <span>Videographer</span>
                <strong>{selectedBooking.videographer ?? "Not Included"}</strong>
              </div>

              <div>
                <span>Total Amount</span>
                <strong>{selectedBooking.totalAmount}</strong>
              </div>

              <div>
                <span>Required Down Payment</span>
                <strong>{selectedBooking.requiredDownPayment}</strong>
              </div>

              <div>
                <span>Verified Payment</span>
                <strong>{selectedBooking.amountVerified}</strong>
              </div>

              <div>
                <span>Remaining Balance</span>
                <strong>{selectedBooking.remainingBalance}</strong>
              </div>
            </div>

            <div className="client-detail-actions">
              

              {canViewAgreement && (
                <button type="button" onClick={() => setIsAgreementOpen(true)}>
                  View Agreement
                </button>
              )}

              {selectedBooking.paymentStatus === "Insufficient" && (
                <button type="button" onClick={handleOpenAdditionalPayment}>
                  Submit Additional Payment
                </button>
              )}

              {selectedBooking.galleryStatus === "Available" && (
                <button type="button">View Gallery</button>
              )}
            </div>

            {!canViewAgreement && (
              <p className="client-muted-note">
                Agreement will become available once the booking is confirmed.
              </p>
            )}
          </aside>
        )}
      </div>

      {isAgreementOpen && selectedBooking && (
        <div
          className="client-modal-backdrop"
          role="presentation"
          onClick={() => setIsAgreementOpen(false)}
        >
          <div
            className="client-agreement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agreement-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="client-modal-header">
              <div>
                <p>Booking Agreement</p>
                <h2 id="agreement-title">Photography Service Agreement</h2>
              </div>

              <button
                type="button"
                className="client-modal-close"
                onClick={() => setIsAgreementOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="agreement-paper">
              <div className="agreement-paper-header">
                <div>
                  <h3>SNAPSMART</h3>
                  <p>Toni Photography</p>
                </div>

                <div>
                  <strong>Agreement No.</strong>
                  <span>{selectedBooking.id}</span>
                </div>
              </div>

              <div className="agreement-title-block">
                <h1>Photography Service Agreement</h1>
                <p>
                  This agreement confirms the photography service booking
                  between Toni Photography and the client for the event stated
                  below.
                </p>
              </div>

              <div className="agreement-info-grid">
                <div>
                  <span>Booking ID</span>
                  <strong>{selectedBooking.id}</strong>
                </div>

                <div>
                  <span>Package</span>
                  <strong>{selectedBooking.packageName}</strong>
                </div>

                <div>
                  <span>Event Type</span>
                  <strong>{selectedBooking.eventType}</strong>
                </div>

                <div>
                  <span>Event Date</span>
                  <strong>{selectedBooking.eventDate}</strong>
                </div>

                <div>
                  <span>Event Time</span>
                  <strong>{selectedBooking.eventTime}</strong>
                </div>

                <div>
                  <span>Theme / Motif</span>
                  <strong>{selectedBooking.themeMotif}</strong>
                </div>
              </div>

              <div className="agreement-section">
                <h4>Event Location</h4>
                <p>{selectedBooking.eventLocation}</p>
              </div>

              <div className="agreement-section">
                <h4>Assigned Photography Team</h4>
                <p>
                  Photographer: <strong>{selectedBooking.photographer}</strong>
                </p>
                <p>
                  Videographer:{" "}
                  <strong>{selectedBooking.videographer ?? "Not Included"}</strong>
                </p>
              </div>

              <div className="agreement-section">
                <h4>Payment Summary</h4>

                <div className="agreement-payment-grid">
                  <div>
                    <span>Total Package Amount</span>
                    <strong>{selectedBooking.totalAmount}</strong>
                  </div>

                  <div>
                    <span>Required Down Payment</span>
                    <strong>{selectedBooking.requiredDownPayment}</strong>
                  </div>

                  <div>
                    <span>Verified Payment</span>
                    <strong>{selectedBooking.amountVerified}</strong>
                  </div>

                  <div>
                    <span>Remaining Balance</span>
                    <strong>{selectedBooking.remainingBalance}</strong>
                  </div>
                </div>
              </div>

              <div className="agreement-section">
                <h4>Terms and Conditions</h4>

                <ol className="agreement-terms">
                  <li>
                    The booking is confirmed only after the required down
                    payment has been verified by Toni Photography.
                  </li>

                  <li>
                    The down payment is non-refundable and secures the
                    photographer’s availability for the agreed event date.
                  </li>

                  <li>
                    The remaining balance must be settled before the final
                    release of the completed event outputs.
                  </li>

                  <li>
                    Toni Photography may use selected photos for portfolio,
                    promotional, and marketing purposes, both online and
                    offline.
                  </li>

                  <li>
                    Toni Photography is not responsible for circumstances beyond
                    its control, such as weather conditions, venue restrictions,
                    delays, or client-related concerns.
                  </li>

                  <li>
                    Edited soft copies will be delivered within two weeks after
                    the event. Final albums and videos will be released within
                    two to three months, depending on the volume and complexity
                    of the project.
                  </li>
                </ol>
              </div>

              <div className="agreement-signature-area">
                <div className="agreement-signature-box">
                  <div className="signature-line">Maria Santos</div>
                  <span>Client Signature</span>
                </div>

                <div className="agreement-signature-box">
                  <div className="signature-line">Toni Photography</div>
                  <span>Authorized Representative</span>
                </div>
              </div>

              <div className="agreement-footer-note">
                <p>
                  This agreement preview is generated for the SNAPSMART client
                  portal.
                </p>
              </div>
            </div>

            <div className="client-modal-actions">
              <button type="button" onClick={() => setIsAgreementOpen(false)}>
                Close
              </button>

              <button type="button">Download Agreement</button>
            </div>
          </div>
        </div>
      )}

      {isAdditionalPaymentOpen && selectedBooking && (
        <div
          className="client-modal-backdrop"
          role="presentation"
          onClick={() => setIsAdditionalPaymentOpen(false)}
        >
          <div
            className="client-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="additional-payment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="client-modal-header">
              <div>
                <p>Additional Payment</p>
                <h2 id="additional-payment-title">
                  Submit Additional Payment
                </h2>
              </div>

              <button
                type="button"
                className="client-modal-close"
                onClick={() => setIsAdditionalPaymentOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="additional-payment-form"
              onSubmit={handleSubmitAdditionalPayment}
            >
              <div className="additional-payment-summary">
                <div>
                  <span>Booking ID</span>
                  <strong>{selectedBooking.id}</strong>
                </div>

                <div>
                  <span>Required Down Payment</span>
                  <strong>{selectedBooking.requiredDownPayment}</strong>
                </div>

                <div>
                  <span>Verified Payment</span>
                  <strong>{selectedBooking.amountVerified}</strong>
                </div>

                <div>
                  <span>Remaining Needed</span>
                  <strong>{selectedBooking.shortageAmount}</strong>
                </div>
              </div>

              <div className="additional-payment-notice">
                Please send the remaining down payment using the selected payment
                method, then upload a screenshot or image of your payment proof.
              </div>

              <label className="additional-payment-field">
                <span>Payment Method</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="GCash">GCash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </label>

              <div className="additional-payment-qr-card">
  <div className="additional-payment-qr">
    {paymentMethod === "GCash" ? "GCash QR" : "Bank QR"}
  </div>

  {paymentMethod === "GCash" ? (
    <div className="additional-payment-reference">
      <strong>GCash Payment Details</strong>
      <p>Account Name: Toni Photography</p>
      <p>Mobile Number: 09XX XXX XXXX</p>
      <p>
        Amount to Pay: <b>{selectedBooking.shortageAmount}</b>
      </p>
    </div>
  ) : (
    <div className="additional-payment-reference">
      <strong>Bank Transfer Details</strong>
      <p>Bank Name: Sample Bank</p>
      <p>Account Name: Toni Photography</p>
      <p>Account Number: 0000 0000 0000</p>
      <p>
        Amount to Pay: <b>{selectedBooking.shortageAmount}</b>
      </p>
    </div>
  )}
</div>

<label className="additional-payment-upload">
  <span>Upload Payment Proof</span>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(event) =>
      setPaymentProofName(event.target.files?.[0]?.name ?? "")
    }
  />

  <div className="additional-payment-upload-button">
    {paymentProofName ? paymentProofName : "Upload Payment Proof"}
  </div>
</label>

              {additionalPaymentMessage && (
                <p className="additional-payment-message">
                  {additionalPaymentMessage}
                </p>
              )}

              <div className="client-modal-actions payment-actions">
                <button
                  type="button"
                  onClick={() => setIsAdditionalPaymentOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default ClientBookings;