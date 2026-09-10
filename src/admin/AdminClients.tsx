import { useMemo, useState } from "react";
import "./Admin.css";

type ClientType = "Online" | "Walk-In";
type ClientStatus = "Active" | "Inactive";

interface ClientBookingHistory {
  id: string;
  packageName: string;
  eventType: string;
  eventDate: string;
  status: string;
  paymentStatus: string;
}

interface AdminClient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  clientType: ClientType;
  status: ClientStatus;
  totalBookings: number;
  totalSpent: string;
  lastBooking: string;
  notes: string;
  bookings: ClientBookingHistory[];
}

const adminClients: AdminClient[] = [
  {
    id: "CL-2026-001",
    fullName: "Maria Santos",
    email: "maria.santos@gmail.com",
    phone: "0917 234 5678",
    address: "Dasmariñas, Cavite",
    clientType: "Online",
    status: "Active",
    totalBookings: 2,
    totalSpent: "₱25,000",
    lastBooking: "Sept. 18, 2026",
    notes:
      "Preferred client for wedding and family events. Usually chooses photo and video coverage.",
    bookings: [
      {
        id: "BK-2026-001",
        packageName: "Storyteller",
        eventType: "Wedding",
        eventDate: "Sept. 18, 2026",
        status: "Awaiting Payment Verification",
        paymentStatus: "For Verification",
      },
      {
        id: "BK-2026-009",
        packageName: "Captured Moments",
        eventType: "Birthday",
        eventDate: "May 10, 2026",
        status: "Completed",
        paymentStatus: "Fully Paid",
      },
    ],
  },
  {
    id: "CL-2026-002",
    fullName: "Angela Cruz",
    email: "angela.cruz@gmail.com",
    phone: "0928 456 1122",
    address: "Imus, Cavite",
    clientType: "Online",
    status: "Active",
    totalBookings: 1,
    totalSpent: "₱9,000",
    lastBooking: "Oct. 4, 2026",
    notes: "Submitted insufficient down payment. Waiting for additional payment proof.",
    bookings: [
      {
        id: "BK-2026-002",
        packageName: "Captured Moments",
        eventType: "Birthday",
        eventDate: "Oct. 4, 2026",
        status: "Payment Insufficient",
        paymentStatus: "Insufficient",
      },
    ],
  },
  {
    id: "CL-2026-003",
    fullName: "Reyes Family",
    email: "reyes.family@gmail.com",
    phone: "0915 765 4432",
    address: "General Trias, Cavite",
    clientType: "Online",
    status: "Active",
    totalBookings: 1,
    totalSpent: "₱6,500",
    lastBooking: "Aug. 28, 2026",
    notes: "Completed christening event. Gallery is already available in the client portal.",
    bookings: [
      {
        id: "BK-2026-003",
        packageName: "Digital Keepsake Plus",
        eventType: "Christening",
        eventDate: "Aug. 28, 2026",
        status: "Completed",
        paymentStatus: "Fully Paid",
      },
    ],
  },
  {
    id: "CL-2026-004",
    fullName: "Daniel Mendoza",
    email: "daniel.mendoza@gmail.com",
    phone: "0999 111 2244",
    address: "Bacoor, Cavite",
    clientType: "Walk-In",
    status: "Active",
    totalBookings: 1,
    totalSpent: "₱16,000",
    lastBooking: "Sept. 22, 2026",
    notes: "Walk-in client record created by the admin.",
    bookings: [
      {
        id: "BK-2026-004",
        packageName: "Storyteller",
        eventType: "Debut",
        eventDate: "Sept. 22, 2026",
        status: "Confirmed",
        paymentStatus: "Verified",
      },
    ],
  },
  {
    id: "CL-2026-005",
    fullName: "Jasmine Dela Cruz",
    email: "jasmine.dc@gmail.com",
    phone: "0906 321 7788",
    address: "Silang, Cavite",
    clientType: "Walk-In",
    status: "Active",
    totalBookings: 1,
    totalSpent: "₱4,500",
    lastBooking: "Sept. 30, 2026",
    notes: "Soft copy package only.",
    bookings: [
      {
        id: "BK-2026-005",
        packageName: "Digital Keepsake Basic",
        eventType: "Birthday",
        eventDate: "Sept. 30, 2026",
        status: "Confirmed",
        paymentStatus: "Verified",
      },
    ],
  },
];

const clientFilters = ["All", "Active", "Online", "Walk-In"];

function AdminClients() {
  const [selectedClientId, setSelectedClientId] = useState(
    adminClients[0]?.id ?? "",
  );
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    return adminClients.filter((client) => {
      const matchesFilter =
        activeFilter === "All" ||
        client.status === activeFilter ||
        client.clientType === activeFilter;

      const searchValue = searchQuery.toLowerCase();

      const matchesSearch =
        client.fullName.toLowerCase().includes(searchValue) ||
        client.email.toLowerCase().includes(searchValue) ||
        client.phone.toLowerCase().includes(searchValue) ||
        client.id.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const selectedClient =
    adminClients.find((client) => client.id === selectedClientId) ??
    adminClients[0];

  const activeClients = adminClients.filter(
    (client) => client.status === "Active",
  ).length;

  const onlineClients = adminClients.filter(
    (client) => client.clientType === "Online",
  ).length;

  const walkInClients = adminClients.filter(
    (client) => client.clientType === "Walk-In",
  ).length;

  const getStatusClass = (status: ClientStatus) => {
    if (status === "Active") return "active";
    return "inactive";
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Client Management</p>
          <h2>Manage clients</h2>
          <span>
            View client records, contact details, booking history, and payment
            activity.
          </span>
        </div>

        <div className="dashboard-actions">
          <button type="button">Add Client</button>
        </div>
      </div>

      <div className="admin-client-summary-grid simplified">
        <article className="admin-client-summary-card">
          <span>Total Clients</span>
          <strong>{adminClients.length}</strong>
          <p>registered client records</p>
        </article>

        <article className="admin-client-summary-card">
          <span>Active Clients</span>
          <strong>{activeClients}</strong>
          <p>clients with active records</p>
        </article>

        <article className="admin-client-summary-card">
          <span>Online Clients</span>
          <strong>{onlineClients}</strong>
          <p>submitted through online booking</p>
        </article>

        <article className="admin-client-summary-card">
          <span>Walk-In Clients</span>
          <strong>{walkInClients}</strong>
          <p>created directly by admin</p>
        </article>
      </div>

      <div className="admin-client-toolbar">
        <div className="admin-client-search">
          <span>Search Client</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, phone, or ID"
          />
        </div>

        <div className="admin-client-filters">
          {clientFilters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-client-layout">
        <div className="admin-client-list">
          {filteredClients.map((client) => (
            <button
              type="button"
              key={client.id}
              className={
                selectedClient.id === client.id
                  ? "admin-client-card active"
                  : "admin-client-card"
              }
              onClick={() => setSelectedClientId(client.id)}
            >
              <div className="admin-client-avatar">
                {client.fullName.charAt(0)}
              </div>

              <div>
                <div className="admin-client-card-top">
                  <span>{client.id}</span>
                  <strong
                    className={`admin-client-status ${getStatusClass(
                      client.status,
                    )}`}
                  >
                    {client.status}
                  </strong>
                </div>

                <h3>{client.fullName}</h3>
                <p>{client.email}</p>
                <small>
                  {client.clientType} • {client.totalBookings} booking
                  {client.totalBookings > 1 ? "s" : ""}
                </small>
              </div>
            </button>
          ))}

          {filteredClients.length === 0 && (
            <div className="admin-client-empty">
              <strong>No clients found</strong>
              <p>Try another search keyword or filter.</p>
            </div>
          )}
        </div>

        {selectedClient && (
          <aside className="admin-client-details">
            <div className="admin-client-profile-top">
              <div className="admin-client-profile-avatar">
                {selectedClient.fullName.charAt(0)}
              </div>

              <div>
                <span>{selectedClient.id}</span>
                <h3>{selectedClient.fullName}</h3>
                <p>{selectedClient.clientType} Client</p>
              </div>
            </div>

            <div className="admin-client-detail-badges">
              <strong
                className={`admin-client-status ${getStatusClass(
                  selectedClient.status,
                )}`}
              >
                {selectedClient.status}
              </strong>
            </div>

            <div className="admin-client-info-grid">
              <div>
                <span>Email</span>
                <strong>{selectedClient.email}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{selectedClient.phone}</strong>
              </div>

              <div>
                <span>Address</span>
                <strong>{selectedClient.address}</strong>
              </div>

              <div>
                <span>Total Bookings</span>
                <strong>{selectedClient.totalBookings}</strong>
              </div>

              <div>
                <span>Total Spent</span>
                <strong>{selectedClient.totalSpent}</strong>
              </div>

              <div>
                <span>Last Booking</span>
                <strong>{selectedClient.lastBooking}</strong>
              </div>
            </div>

            <div className="admin-client-notes">
              <span>Client Notes</span>
              <p>{selectedClient.notes}</p>
            </div>

            <div className="admin-client-history">
              <div className="admin-client-section-heading">
                <span>Booking History</span>
              </div>

              {selectedClient.bookings.map((booking) => (
                <div key={booking.id} className="admin-client-booking-row">
                  <div>
                    <strong>{booking.id}</strong>
                    <p>
                      {booking.packageName} • {booking.eventType}
                    </p>
                  </div>

                  <div>
                    <span>{booking.eventDate}</span>
                    <small>{booking.status}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-client-actions">
              <button type="button">Edit Client</button>
              <button type="button">View Bookings</button>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

export default AdminClients;