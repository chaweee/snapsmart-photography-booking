import { useMemo, useState } from "react";
import "./Admin.css";

type BookingStatus =
  | "Pending"
  | "Awaiting Payment"
  | "For Verification"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

type PaymentStatus =
  | "No Payment Yet"
  | "Payment Proof Uploaded"
  | "Down Payment Verified"
  | "Fully Paid"
  | "Rejected";

interface AdminBooking {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  packageName: string;
  eventType: string;
  eventDate: string;
  time: string;
  location: string;
  themeMotif: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  balance: string;
  photographer: string;
  videographer?: string;
  notes: string;
}

const mockBookings: AdminBooking[] = [
  {
    id: "BK-2026-001",
    clientName: "Maria Santos",
    phone: "0917 234 5678",
    email: "maria.santos@example.com",
    packageName: "Storyteller",
    eventType: "Wedding",
    eventDate: "Sept. 18, 2026",
    time: "9:00 AM - 4:00 PM",
    location: "San Jose, Batangas",
    themeMotif: "Rustic garden",
    status: "For Verification",
    paymentStatus: "Payment Proof Uploaded",
    amountPaid: "₱4,800",
    balance: "₱11,200",
    photographer: "Toni Villacoba",
    videographer: "Videographer A",
    notes: "Client requested outdoor couple shots before ceremony.",
  },
  {
    id: "BK-2026-002",
    clientName: "John Reyes",
    phone: "0928 111 2233",
    email: "john.reyes@example.com",
    packageName: "Digital Keepsake Plus",
    eventType: "Birthday",
    eventDate: "Sept. 21, 2026",
    time: "2:00 PM - 6:00 PM",
    location: "Lipa City, Batangas",
    themeMotif: "Blue and silver",
    status: "Confirmed",
    paymentStatus: "Down Payment Verified",
    amountPaid: "₱1,950",
    balance: "₱4,550",
    photographer: "Photographer A",
    notes: "Family requested candid shots and birthday program coverage.",
  },
  {
    id: "BK-2026-003",
    clientName: "Angela Cruz",
    phone: "0999 882 1122",
    email: "angela.cruz@example.com",
    packageName: "Signature Experience",
    eventType: "Wedding",
    eventDate: "Sept. 28, 2026",
    time: "8:00 AM - 5:00 PM",
    location: "Batangas City",
    themeMotif: "Classic white",
    status: "Pending",
    paymentStatus: "No Payment Yet",
    amountPaid: "₱0",
    balance: "₱30,000",
    photographer: "No Preference",
    videographer: "No Preference",
    notes: "Waiting for client confirmation and payment.",
  },
  {
    id: "BK-2026-004",
    clientName: "Sophia Mendoza",
    phone: "0906 555 7700",
    email: "sophia.mendoza@example.com",
    packageName: "Captured Moments",
    eventType: "Christening",
    eventDate: "Sept. 21, 2026",
    time: "9:00 AM - 12:00 PM",
    location: "Rosario, Batangas",
    themeMotif: "Pastel pink",
    status: "Confirmed",
    paymentStatus: "Down Payment Verified",
    amountPaid: "₱2,700",
    balance: "₱6,300",
    photographer: "Toni Villacoba",
    notes: "Church ceremony followed by simple reception.",
  },
  {
    id: "BK-2026-005",
    clientName: "Nicole Garcia",
    phone: "0915 654 7788",
    email: "nicole.garcia@example.com",
    packageName: "Storyteller + Guestbook",
    eventType: "Debut",
    eventDate: "Oct. 4, 2026",
    time: "3:00 PM - 9:00 PM",
    location: "Tanauan City, Batangas",
    themeMotif: "Black and gold",
    status: "Awaiting Payment",
    paymentStatus: "No Payment Yet",
    amountPaid: "₱0",
    balance: "₱19,000",
    photographer: "Photographer B",
    videographer: "Videographer B",
    notes: "Client wants guestbook and full event highlights.",
  },
  {
    id: "BK-2026-006",
    clientName: "Carlos Dela Cruz",
    phone: "0933 222 4411",
    email: "carlos.dc@example.com",
    packageName: "Digital Keepsake Basic",
    eventType: "Special Event",
    eventDate: "Oct. 10, 2026",
    time: "10:00 AM - 2:00 PM",
    location: "Mataasnakahoy, Batangas",
    themeMotif: "Corporate neutral",
    status: "Completed",
    paymentStatus: "Fully Paid",
    amountPaid: "₱4,500",
    balance: "₱0",
    photographer: "Toni Villacoba",
    notes: "Final soft copies delivered.",
  },
];

const statusOptions = [
  "All",
  "Pending",
  "Awaiting Payment",
  "For Verification",
  "Confirmed",
  "Completed",
  "Cancelled",
];

function getBookingStatusClass(status: BookingStatus) {
  switch (status) {
    case "Confirmed":
      return "booking-status confirmed";
    case "Completed":
      return "booking-status completed";
    case "Cancelled":
      return "booking-status cancelled";
    case "For Verification":
      return "booking-status verification";
    case "Awaiting Payment":
      return "booking-status awaiting";
    default:
      return "booking-status pending";
  }
}

function getPaymentStatusClass(status: PaymentStatus) {
  switch (status) {
    case "Fully Paid":
      return "payment-status paid";
    case "Down Payment Verified":
      return "payment-status verified";
    case "Payment Proof Uploaded":
      return "payment-status uploaded";
    case "Rejected":
      return "payment-status rejected";
    default:
      return "payment-status unpaid";
  }
}

function AdminBookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBookingId, setSelectedBookingId] = useState(mockBookings[0].id);

  const filteredBookings = useMemo(() => {
    return mockBookings.filter((booking) => {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        booking.clientName.toLowerCase().includes(searchValue) ||
        booking.id.toLowerCase().includes(searchValue) ||
        booking.packageName.toLowerCase().includes(searchValue) ||
        booking.eventType.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const selectedBooking =
    mockBookings.find((booking) => booking.id === selectedBookingId) ??
    mockBookings[0];

  const totalBookings = mockBookings.length;
  const pendingBookings = mockBookings.filter(
    (booking) =>
      booking.status === "Pending" || booking.status === "Awaiting Payment",
  ).length;
  const confirmedBookings = mockBookings.filter(
    (booking) => booking.status === "Confirmed",
  ).length;
  const verificationBookings = mockBookings.filter(
    (booking) => booking.status === "For Verification",
  ).length;

  return (
    <div className="admin-bookings-page">
      <section className="admin-page-heading">
        <div>
          <p>Manage Bookings</p>
          <h2>Booking records</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button">Add Booking</button>
          <button type="button">Export Bookings</button>
        </div>
      </section>

      <section className="booking-summary-grid">
        <article className="overview-card">
          <span>Total Bookings</span>
          <strong>{totalBookings}</strong>
          <p>All mock booking records</p>
        </article>

        <article className="overview-card">
          <span>Pending</span>
          <strong>{pendingBookings}</strong>
          <p>Needs client/admin action</p>
        </article>

        <article className="overview-card">
          <span>Confirmed</span>
          <strong>{confirmedBookings}</strong>
          <p>Approved event schedules</p>
        </article>

        <article className="overview-card">
          <span>For Verification</span>
          <strong>{verificationBookings}</strong>
          <p>Payment proof uploaded</p>
        </article>
      </section>

      <section className="bookings-layout">
        <article className="admin-panel bookings-table-panel">
          <div className="booking-tools">
            <label className="booking-search">
              <span>Search Booking</span>
              <input
                type="search"
                placeholder="Search by client, booking ID, package, or event"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="booking-filter">
              <span>Status Filter</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Client</th>
                  <th>Package</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={
                      selectedBooking.id === booking.id ? "selected-row" : ""
                    }
                    onClick={() => setSelectedBookingId(booking.id)}
                  >
                    <td>{booking.id}</td>
                    <td>
                      <strong>{booking.clientName}</strong>
                      <br />
                      <span>{booking.phone}</span>
                    </td>
                    <td>{booking.packageName}</td>
                    <td>{booking.eventType}</td>
                    <td>{booking.eventDate}</td>
                    <td>
                      <span className={getBookingStatusClass(booking.status)}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <span className={getPaymentStatusClass(booking.paymentStatus)}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="booking-empty-state">
              <strong>No bookings found</strong>
              <p>Try changing the search keyword or status filter.</p>
            </div>
          )}
        </article>

        <aside className="admin-panel booking-detail-panel">
          <div className="booking-detail-header">
            <span>{selectedBooking.id}</span>
            <h3>{selectedBooking.clientName}</h3>
            <p>{selectedBooking.packageName}</p>
          </div>

          <div className="booking-detail-statuses">
            <span className={getBookingStatusClass(selectedBooking.status)}>
              {selectedBooking.status}
            </span>

            <span className={getPaymentStatusClass(selectedBooking.paymentStatus)}>
              {selectedBooking.paymentStatus}
            </span>
          </div>

          <div className="booking-detail-list">
            <div>
              <span>Phone</span>
              <strong>{selectedBooking.phone}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{selectedBooking.email}</strong>
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
              <span>Time</span>
              <strong>{selectedBooking.time}</strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{selectedBooking.location}</strong>
            </div>

            <div>
              <span>Theme / Motif</span>
              <strong>{selectedBooking.themeMotif}</strong>
            </div>

            <div>
              <span>Photographer</span>
              <strong>{selectedBooking.photographer}</strong>
            </div>

            {selectedBooking.videographer && (
              <div>
                <span>Videographer</span>
                <strong>{selectedBooking.videographer}</strong>
              </div>
            )}

            <div>
              <span>Amount Paid</span>
              <strong>{selectedBooking.amountPaid}</strong>
            </div>

            <div>
              <span>Balance</span>
              <strong>{selectedBooking.balance}</strong>
            </div>

            <div className="full-detail">
              <span>Notes</span>
              <strong>{selectedBooking.notes}</strong>
            </div>
          </div>

          <div className="booking-detail-actions">
            <button type="button">View Full Details</button>
            <button type="button">Update Status</button>
            <button type="button">Verify Payment</button>
            <button type="button">Open Gallery</button>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AdminBookings;