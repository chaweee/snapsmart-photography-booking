import "./Admin.css";
import { adminTodoItems } from "./adminMockData";

const overviewCards = [
  {
    label: "Total Bookings",
    value: "24",
    helper: "All booking records",
  },
  {
    label: "Pending Bookings",
    value: "6",
    helper: "Awaiting review",
  },
  {
    label: "Confirmed Events",
    value: "12",
    helper: "Approved schedules",
  },
  {
    label: "Pending Payments",
    value: "4",
    helper: "Needs verification",
  },
  {
    label: "Total Revenue",
    value: "₱86,500",
    helper: "Verified payments",
  },
  {
    label: "Upcoming Events",
    value: "8",
    helper: "Next scheduled shoots",
  },
];

const recentBookings = [
  {
    client: "Maria Santos",
    package: "Storyteller",
    eventType: "Wedding",
    date: "Sept. 18, 2026",
    status: "Awaiting Payment",
  },
  {
    client: "John Reyes",
    package: "Digital Keepsake Plus",
    eventType: "Birthday",
    date: "Sept. 21, 2026",
    status: "Confirmed",
  },
  {
    client: "Angela Cruz",
    package: "Signature Experience",
    eventType: "Wedding",
    date: "Sept. 28, 2026",
    status: "Pending",
  },
];

const pendingPayments = [
  {
    client: "Maria Santos",
    method: "GCash",
    amount: "₱4,800",
    status: "For Verification",
  },
  {
    client: "Angela Cruz",
    method: "Bank Transfer",
    amount: "₱9,000",
    status: "For Verification",
  },
];

function AdminDashboard() {
  const pendingTodoItems = adminTodoItems
    .filter((item) => item.status !== "Completed")
    .slice(0, 4);

  return (
    <div className="admin-dashboard">
      <section className="admin-page-heading">
        <div>
          <p>Dashboard / Analytics</p>
          <h2>Business overview</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button">Export Booking Report</button>
          <button type="button">Export Payment Report</button>
          <button type="button">Export Analytics Summary</button>
        </div>
      </section>

      <section className="overview-grid">
        {overviewCards.map((card) => (
          <article className="overview-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="analytics-grid">
        <article className="admin-panel large">
          <div className="admin-panel-heading">
            <div>
              <p>Analytics</p>
              <h3>Monthly booking trend</h3>
            </div>
          </div>

          <div className="chart-placeholder">
            <div style={{ height: "38%" }} />
            <div style={{ height: "62%" }} />
            <div style={{ height: "46%" }} />
            <div style={{ height: "75%" }} />
            <div style={{ height: "58%" }} />
            <div style={{ height: "88%" }} />
          </div>

          <p className="panel-note">
            Chart placeholder muna. Later, this will use real Supabase booking
            data grouped by month.
          </p>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p>Package Performance</p>
              <h3>Most booked package</h3>
            </div>
          </div>

          <div className="popular-package">
            <span>Top Package</span>
            <strong>Storyteller</strong>
            <p>Photo & Video Coverage</p>
          </div>

          <div className="mini-stat-list">
            <div>
              <span>Wedding</span>
              <strong>45%</strong>
            </div>

            <div>
              <span>Birthday</span>
              <strong>30%</strong>
            </div>

            <div>
              <span>Debut</span>
              <strong>25%</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-data-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p>Bookings</p>
              <h3>Recent bookings</h3>
            </div>

            <button type="button">View All</button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Package</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={`${booking.client}-${booking.date}`}>
                    <td>{booking.client}</td>
                    <td>{booking.package}</td>
                    <td>{booking.eventType}</td>
                    <td>{booking.date}</td>
                    <td>
                      <span className="status-pill">{booking.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p>Payments</p>
              <h3>Needs verification</h3>
            </div>

            <button type="button">Manage</button>
          </div>

          <div className="payment-list">
            {pendingPayments.map((payment) => (
              <div className="payment-item" key={payment.client}>
                <div>
                  <strong>{payment.client}</strong>
                  <span>{payment.method}</span>
                </div>

                <div>
                  <strong>{payment.amount}</strong>
                  <span>{payment.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p>Tasks</p>
              <h3>To-do list</h3>
            </div>

            <button type="button">Open</button>
          </div>

          <ul className="todo-preview-list">
            {pendingTodoItems.map((item) => (
              <li key={item.id}>
                <span />
                {item.title}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;