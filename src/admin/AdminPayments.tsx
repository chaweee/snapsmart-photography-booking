import { useMemo, useState } from "react";
import "./Admin.css";

type BookingType = "Online" | "Walk-In";

type PaymentMethod = "GCash" | "Bank Transfer" | "Cash";

type PaymentStatus =
  | "For Verification"
  | "Verified"
  | "Rejected"
  | "No Payment Yet"
  | "Fully Paid";

interface AdminPayment {
  id: string;
  bookingId: string;
  bookingType: BookingType;
  clientName: string;
  packageName: string;
  eventType: string;
  eventDate: string;
  paymentMethod: PaymentMethod;
  paymentType: "Down Payment" | "Final Payment" | "Full Payment";
  amountPaid: string;
  totalAmount: string;
  remainingBalance: string;
  status: PaymentStatus;
  submittedAt: string;
  verifiedBy?: string;
  receiptAvailable: boolean;
  receiptReference?: string;
  senderName?: string;
  notes: string;
}

const mockPayments: AdminPayment[] = [
  {
    id: "PAY-2026-001",
    bookingId: "BK-2026-001",
    bookingType: "Online",
    clientName: "Maria Santos",
    packageName: "Storyteller",
    eventType: "Wedding",
    eventDate: "Sept. 18, 2026",
    paymentMethod: "GCash",
    paymentType: "Down Payment",
    amountPaid: "₱4,800",
    totalAmount: "₱16,000",
    remainingBalance: "₱11,200",
    status: "For Verification",
    submittedAt: "Sept. 10, 2026 • 10:42 AM",
    receiptAvailable: true,
    receiptReference: "GCASH-8842-2026",
    senderName: "Maria Santos",
    notes:
      "Client uploaded GCash payment proof. Admin needs to verify receipt details.",
  },
  {
    id: "PAY-2026-002",
    bookingId: "BK-2026-002",
    bookingType: "Walk-In",
    clientName: "John Reyes",
    packageName: "Digital Keepsake Plus",
    eventType: "Birthday",
    eventDate: "Sept. 21, 2026",
    paymentMethod: "Cash",
    paymentType: "Down Payment",
    amountPaid: "₱1,950",
    totalAmount: "₱6,500",
    remainingBalance: "₱4,550",
    status: "Verified",
    submittedAt: "Sept. 10, 2026 • 1:15 PM",
    verifiedBy: "Admin",
    receiptAvailable: false,
    notes: "Walk-in cash payment received and verified by admin on-site.",
  },
  {
    id: "PAY-2026-003",
    bookingId: "BK-2026-003",
    bookingType: "Online",
    clientName: "Angela Cruz",
    packageName: "Signature Experience",
    eventType: "Wedding",
    eventDate: "Sept. 28, 2026",
    paymentMethod: "Bank Transfer",
    paymentType: "Down Payment",
    amountPaid: "₱9,000",
    totalAmount: "₱30,000",
    remainingBalance: "₱21,000",
    status: "For Verification",
    submittedAt: "Sept. 10, 2026 • 3:30 PM",
    receiptAvailable: true,
    receiptReference: "BANK-TRF-7328",
    senderName: "Angela Cruz",
    notes:
      "Client uploaded bank transfer proof. Admin needs to check before confirming booking.",
  },
  {
    id: "PAY-2026-004",
    bookingId: "BK-2026-004",
    bookingType: "Walk-In",
    clientName: "Sophia Mendoza",
    packageName: "Captured Moments",
    eventType: "Christening",
    eventDate: "Sept. 21, 2026",
    paymentMethod: "GCash",
    paymentType: "Down Payment",
    amountPaid: "₱2,700",
    totalAmount: "₱9,000",
    remainingBalance: "₱6,300",
    status: "Verified",
    submittedAt: "Sept. 10, 2026 • 4:05 PM",
    verifiedBy: "Admin",
    receiptAvailable: false,
    notes:
      "Walk-in GCash payment confirmed by admin after checking client confirmation screen.",
  },
  {
    id: "PAY-2026-005",
    bookingId: "BK-2026-005",
    bookingType: "Online",
    clientName: "Nicole Garcia",
    packageName: "Storyteller + Guestbook",
    eventType: "Debut",
    eventDate: "Oct. 4, 2026",
    paymentMethod: "GCash",
    paymentType: "Down Payment",
    amountPaid: "₱0",
    totalAmount: "₱19,000",
    remainingBalance: "₱19,000",
    status: "No Payment Yet",
    submittedAt: "Not submitted",
    receiptAvailable: false,
    notes: "Client has not uploaded payment proof yet.",
  },
  {
    id: "PAY-2026-006",
    bookingId: "BK-2026-006",
    bookingType: "Online",
    clientName: "Carlos Dela Cruz",
    packageName: "Digital Keepsake Basic",
    eventType: "Special Event",
    eventDate: "Oct. 10, 2026",
    paymentMethod: "Bank Transfer",
    paymentType: "Full Payment",
    amountPaid: "₱4,500",
    totalAmount: "₱4,500",
    remainingBalance: "₱0",
    status: "Fully Paid",
    submittedAt: "Sept. 9, 2026 • 9:18 AM",
    verifiedBy: "Admin",
    receiptAvailable: true,
    receiptReference: "BANK-TRF-4421",
    senderName: "Carlos Dela Cruz",
    notes: "Payment verified and final soft copies already delivered.",
  },
];

const statusFilters = [
  "All",
  "For Verification",
  "Verified",
  "Rejected",
  "No Payment Yet",
  "Fully Paid",
];

const bookingTypeFilters = ["All", "Online", "Walk-In"];

function getPaymentPageStatusClass(status: PaymentStatus) {
  switch (status) {
    case "Verified":
      return "payment-page-status verified";
    case "Fully Paid":
      return "payment-page-status paid";
    case "Rejected":
      return "payment-page-status rejected";
    case "For Verification":
      return "payment-page-status verification";
    default:
      return "payment-page-status unpaid";
  }
}

function getBookingTypeClass(type: BookingType) {
  return type === "Online"
    ? "booking-type-pill online"
    : "booking-type-pill walkin";
}

function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState(mockPayments[0].id);
  const [receiptModalPaymentId, setReceiptModalPaymentId] = useState<
    string | null
  >(null);

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        payment.clientName.toLowerCase().includes(searchValue) ||
        payment.bookingId.toLowerCase().includes(searchValue) ||
        payment.id.toLowerCase().includes(searchValue) ||
        payment.packageName.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      const matchesBookingType =
        bookingTypeFilter === "All" || payment.bookingType === bookingTypeFilter;

      return matchesSearch && matchesStatus && matchesBookingType;
    });
  }, [searchTerm, statusFilter, bookingTypeFilter]);

  const selectedPayment =
    mockPayments.find((payment) => payment.id === selectedPaymentId) ??
    mockPayments[0];

  const receiptModalPayment = receiptModalPaymentId
    ? mockPayments.find((payment) => payment.id === receiptModalPaymentId)
    : null;

  const forVerificationCount = mockPayments.filter(
    (payment) => payment.status === "For Verification",
  ).length;

  const verifiedCount = mockPayments.filter(
    (payment) => payment.status === "Verified" || payment.status === "Fully Paid",
  ).length;

  const onlineCount = mockPayments.filter(
    (payment) => payment.bookingType === "Online",
  ).length;

  const walkInCount = mockPayments.filter(
    (payment) => payment.bookingType === "Walk-In",
  ).length;

  const openReceiptModal = (payment: AdminPayment) => {
    if (!payment.receiptAvailable) {
      return;
    }

    setSelectedPaymentId(payment.id);
    setReceiptModalPaymentId(payment.id);
  };

  const closeReceiptModal = () => {
    setReceiptModalPaymentId(null);
  };

  return (
    <div className="admin-payments-page">
      <section className="admin-page-heading">
        <div>
          <p>Manage Payments</p>
          <h2>Payment records</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button">Export Payment Report</button>
          <button type="button">View Bookings</button>
        </div>
      </section>

      <section className="payment-summary-grid">
        <article className="overview-card">
          <span>For Verification</span>
          <strong>{forVerificationCount}</strong>
          <p>Online receipts to review</p>
        </article>

        <article className="overview-card">
          <span>Verified Payments</span>
          <strong>{verifiedCount}</strong>
          <p>Approved payment records</p>
        </article>

        <article className="overview-card">
          <span>Online Payments</span>
          <strong>{onlineCount}</strong>
          <p>May include receipt uploads</p>
        </article>

        <article className="overview-card">
          <span>Walk-In Payments</span>
          <strong>{walkInCount}</strong>
          <p>Verified on-site by admin</p>
        </article>
      </section>

      <section className="payments-layout">
        <article className="admin-panel payments-table-panel">
          <div className="payment-tools">
            <label className="payment-search">
              <span>Search Payment</span>
              <input
                type="search"
                placeholder="Search by client, payment ID, booking ID, or package"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="payment-filter">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusFilters.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="payment-filter">
              <span>Booking Type</span>
              <select
                value={bookingTypeFilter}
                onChange={(event) => setBookingTypeFilter(event.target.value)}
              >
                {bookingTypeFilters.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Booking</th>
                  <th>Client</th>
                  <th>Method</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={
                      selectedPayment.id === payment.id ? "selected-row" : ""
                    }
                    onClick={() => setSelectedPaymentId(payment.id)}
                  >
                    <td>{payment.id}</td>

                    <td>
                      <strong>{payment.bookingId}</strong>
                      <br />
                      <span className={getBookingTypeClass(payment.bookingType)}>
                        {payment.bookingType}
                      </span>
                    </td>

                    <td>
                      <strong>{payment.clientName}</strong>
                      <br />
                      <span>{payment.packageName}</span>
                    </td>

                    <td>{payment.paymentMethod}</td>
                    <td>{payment.amountPaid}</td>
                    <td>{payment.remainingBalance}</td>

                    <td>
                      <span className={getPaymentPageStatusClass(payment.status)}>
                        {payment.status}
                      </span>
                    </td>

                    <td>
                      {payment.receiptAvailable ? (
                        <button
                          type="button"
                          className="receipt-mini-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openReceiptModal(payment);
                          }}
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="no-receipt-text">
                          {payment.bookingType === "Walk-In"
                            ? "Not required"
                            : "No upload"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="booking-empty-state">
              <strong>No payments found</strong>
              <p>Try changing the search keyword or filters.</p>
            </div>
          )}
        </article>

        <aside className="admin-panel payment-detail-panel">
          <div className="payment-detail-header">
            <span>{selectedPayment.id}</span>
            <h3>{selectedPayment.clientName}</h3>
            <p>{selectedPayment.bookingId}</p>
          </div>

          <div className="payment-detail-badges">
            <span className={getPaymentPageStatusClass(selectedPayment.status)}>
              {selectedPayment.status}
            </span>

            <span className={getBookingTypeClass(selectedPayment.bookingType)}>
              {selectedPayment.bookingType}
            </span>
          </div>

          <div className="payment-receipt-preview">
            {selectedPayment.receiptAvailable ? (
              <>
                <div className="receipt-placeholder">
                  <span>Receipt Preview</span>
                </div>

                <button
                  type="button"
                  onClick={() => openReceiptModal(selectedPayment)}
                >
                  View Payment Receipt
                </button>
              </>
            ) : (
              <div className="receipt-not-required">
                <strong>
                  {selectedPayment.bookingType === "Walk-In"
                    ? "Receipt upload not required"
                    : "No receipt uploaded"}
                </strong>

                <p>
                  {selectedPayment.bookingType === "Walk-In"
                    ? "This is a walk-in transaction. The admin verifies the payment on-site, so uploaded receipt proof is not required."
                    : "This online booking does not have an uploaded payment proof yet."}
                </p>
              </div>
            )}
          </div>

          <div className="payment-detail-list">
            <div>
              <span>Booking Type</span>
              <strong>{selectedPayment.bookingType}</strong>
            </div>

            <div>
              <span>Package</span>
              <strong>{selectedPayment.packageName}</strong>
            </div>

            <div>
              <span>Event</span>
              <strong>{selectedPayment.eventType}</strong>
            </div>

            <div>
              <span>Event Date</span>
              <strong>{selectedPayment.eventDate}</strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>{selectedPayment.paymentMethod}</strong>
            </div>

            <div>
              <span>Payment Type</span>
              <strong>{selectedPayment.paymentType}</strong>
            </div>

            <div>
              <span>Total Amount</span>
              <strong>{selectedPayment.totalAmount}</strong>
            </div>

            <div>
              <span>Amount Paid</span>
              <strong>{selectedPayment.amountPaid}</strong>
            </div>

            <div>
              <span>Remaining Balance</span>
              <strong>{selectedPayment.remainingBalance}</strong>
            </div>

            <div>
              <span>Submitted At</span>
              <strong>{selectedPayment.submittedAt}</strong>
            </div>

            <div>
              <span>Verified By</span>
              <strong>{selectedPayment.verifiedBy ?? "Not verified yet"}</strong>
            </div>

            <div className="full-detail">
              <span>Notes</span>
              <strong>{selectedPayment.notes}</strong>
            </div>
          </div>

          <div className="payment-detail-actions">
            <button
              type="button"
              disabled={selectedPayment.status === "Verified"}
            >
              Verify Payment
            </button>

            <button
              type="button"
              disabled={
                selectedPayment.status === "Verified" ||
                selectedPayment.status === "Fully Paid"
              }
            >
              Reject Payment
            </button>

            <button type="button">View Booking</button>
          </div>
        </aside>
      </section>

      {receiptModalPayment && (
        <div className="payment-modal-backdrop" role="presentation">
          <div
            className="payment-receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-modal-title"
          >
            <div className="payment-modal-header">
              <div>
                <p>Payment Receipt Review</p>
                <h3 id="receipt-modal-title">
                  {receiptModalPayment.clientName}
                </h3>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                aria-label="Close payment receipt modal"
                onClick={closeReceiptModal}
              >
                ×
              </button>
            </div>

            <div className="payment-modal-body">
              <div className="mock-receipt-card">
                <div className="mock-receipt-top">
                  <span>{receiptModalPayment.paymentMethod}</span>
                  <strong>Payment Receipt</strong>
                  <p>{receiptModalPayment.submittedAt}</p>
                </div>

                <div className="mock-receipt-amount">
                  {receiptModalPayment.amountPaid}
                </div>

                <div className="mock-receipt-lines">
                  <div>
                    <span>Sender</span>
                    <strong>
                      {receiptModalPayment.senderName ??
                        receiptModalPayment.clientName}
                    </strong>
                  </div>

                  <div>
                    <span>Reference</span>
                    <strong>
                      {receiptModalPayment.receiptReference ?? "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Payment Type</span>
                    <strong>{receiptModalPayment.paymentType}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>{receiptModalPayment.status}</strong>
                  </div>
                </div>

                <div className="mock-receipt-watermark">
                  MOCK RECEIPT PREVIEW
                </div>
              </div>

              <div className="receipt-review-details">
                <div className="receipt-review-heading">
                  <p>Booking & Payment Details</p>
                  <h4>{receiptModalPayment.bookingId}</h4>
                </div>

                <div className="receipt-review-grid">
                  <div>
                    <span>Payment ID</span>
                    <strong>{receiptModalPayment.id}</strong>
                  </div>

                  <div>
                    <span>Client Name</span>
                    <strong>{receiptModalPayment.clientName}</strong>
                  </div>

                  <div>
                    <span>Package</span>
                    <strong>{receiptModalPayment.packageName}</strong>
                  </div>

                  <div>
                    <span>Event Type</span>
                    <strong>{receiptModalPayment.eventType}</strong>
                  </div>

                  <div>
                    <span>Event Date</span>
                    <strong>{receiptModalPayment.eventDate}</strong>
                  </div>

                  <div>
                    <span>Payment Method</span>
                    <strong>{receiptModalPayment.paymentMethod}</strong>
                  </div>

                  <div>
                    <span>Total Amount</span>
                    <strong>{receiptModalPayment.totalAmount}</strong>
                  </div>

                  <div>
                    <span>Amount Paid</span>
                    <strong>{receiptModalPayment.amountPaid}</strong>
                  </div>

                  <div>
                    <span>Remaining Balance</span>
                    <strong>{receiptModalPayment.remainingBalance}</strong>
                  </div>

                  <div>
                    <span>Submitted At</span>
                    <strong>{receiptModalPayment.submittedAt}</strong>
                  </div>

                  <div className="full-detail">
                    <span>Admin Review Note</span>
                    <strong>{receiptModalPayment.notes}</strong>
                  </div>
                </div>

                <label className="receipt-review-comment">
                  <span>Rejection Reason / Verification Note</span>
                  <textarea
                    rows={4}
                    placeholder="Example: Amount matches the required down payment. Receipt is valid."
                  />
                </label>
              </div>
            </div>

            <div className="payment-modal-actions">
              <button type="button" onClick={closeReceiptModal}>
                Close
              </button>

              <button type="button" className="reject-button">
                Reject Payment
              </button>

              <button type="button" className="accept-button">
                Accept / Verify Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;