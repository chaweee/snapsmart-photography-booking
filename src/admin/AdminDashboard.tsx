import { useMemo, useState } from "react";
import "./Admin.css";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const years = ["2024", "2025", "2026", "2027"];

const overviewCards = [
  {
    label: "Total Bookings",
    value: "38",
    note: "bookings for selected period",
  },
  {
    label: "Monthly Revenue",
    value: "₱184,500",
    note: "verified and expected payments",
  },
  {
    label: "Pending Payments",
    value: "7",
    note: "need admin verification",
  },
  {
    label: "Confirmed Events",
    value: "18",
    note: "scheduled confirmed bookings",
  },
];

const bookingTrends = [
  { month: "May", bookings: 8 },
  { month: "Jun", bookings: 12 },
  { month: "Jul", bookings: 10 },
  { month: "Aug", bookings: 15 },
  { month: "Sep", bookings: 18 },
];

const packageDemand = [
  { name: "Storyteller", percent: 45, count: 17 },
  { name: "Captured Moments", percent: 25, count: 10 },
  { name: "Digital Keepsake Plus", percent: 18, count: 7 },
  { name: "Digital Keepsake Basic", percent: 12, count: 4 },
];

const bookingStatusSummary = [
  { status: "Pending", count: 5 },
  { status: "Awaiting Payment Verification", count: 7 },
  { status: "Confirmed", count: 18 },
  { status: "Payment Insufficient", count: 2 },
  { status: "Completed", count: 6 },
];

const paymentStatusSummary = [
  { status: "No Payment Yet", count: 4 },
  { status: "For Verification", count: 7 },
  { status: "Verified", count: 14 },
  { status: "Insufficient", count: 2 },
  { status: "Fully Paid", count: 11 },
];

const upcomingEvents = [
  {
    id: "BK-2026-001",
    client: "Maria Santos",
    event: "Wedding",
    date: "Sept. 18, 2026",
    time: "2:00 PM - 8:00 PM",
    packageName: "Storyteller",
    photographer: "Toni Villacoba",
    videographer: "Carlo Reyes",
  },
  {
    id: "BK-2026-004",
    client: "Daniel Mendoza",
    event: "Debut",
    date: "Sept. 22, 2026",
    time: "4:00 PM - 9:00 PM",
    packageName: "Storyteller",
    photographer: "Toni Villacoba",
    videographer: "Mika Lopez",
  },
  {
    id: "BK-2026-005",
    client: "Jasmine Dela Cruz",
    event: "Birthday",
    date: "Sept. 30, 2026",
    time: "3:00 PM - 6:00 PM",
    packageName: "Digital Keepsake Basic",
    photographer: "No Preference",
    videographer: "Not Required",
  },
];

const staffAvailability = [
  {
    name: "Toni Villacoba",
    role: "Photographer",
    status: "Booked",
    note: "Assigned to Sept. 18 wedding",
  },
  {
    name: "Carlo Reyes",
    role: "Videographer",
    status: "Available",
    note: "Open for new assignments",
  },
  {
    name: "Mika Lopez",
    role: "Videographer",
    status: "Unavailable",
    note: "Marked unavailable this week",
  },
];

const actionItems = [
  {
    title: "Verify payment proof",
    description: "Maria Santos uploaded a down payment receipt for review.",
    tag: "Payment",
  },
  {
    title: "Review insufficient payment",
    description: "Angela Cruz needs to upload an additional payment proof.",
    tag: "Finance",
  },
  {
    title: "Prepare client gallery",
    description: "Reyes Family gallery is ready for client release.",
    tag: "Gallery",
  },
  {
    title: "Confirm staff assignment",
    description: "Daniel Mendoza debut needs final schedule confirmation.",
    tag: "Schedule",
  },
];

function AdminDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [selectedYear, setSelectedYear] = useState("2026");

  const selectedPeriod = useMemo(() => {
    return `${selectedMonth} ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  const trendPeriodLabel = useMemo(() => {
    return `May - ${selectedMonth.slice(0, 3)} ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  const highestBookingCount = Math.max(
    ...bookingTrends.map((trend) => trend.bookings),
  );

  const getStaffStatusClass = (status: string) => {
    if (status === "Available") return "available";
    if (status === "Booked") return "booked";
    return "unavailable";
  };

  const formatCsvCell = (cell: string | number) => {
    return `"${String(cell).replace(/"/g, '""')}"`;
  };

  const handleExportReport = () => {
    const reportRows: (string | number)[][] = [
      ["SNAPSMART Business Analytics Report"],
      ["Generated", new Date().toLocaleString()],
      ["Report Period", selectedPeriod],
      [],
      ["Overview"],
      ["Metric", "Value", "Note"],
      ...overviewCards.map((card) => [card.label, card.value, card.note]),
      [],
      ["Booking Trends"],
      ["Month", "Bookings"],
      ...bookingTrends.map((trend) => [trend.month, trend.bookings]),
      [],
      ["Financial Performance"],
      ["Metric", "Amount"],
      ["Total Expected Revenue", "₱214,500"],
      ["Verified Payments", "₱148,000"],
      ["Pending Verification", "₱21,500"],
      ["Remaining Balances", "₱45,000"],
      [],
      ["Package Demand"],
      ["Package", "Bookings", "Demand Share"],
      ...packageDemand.map((item) => [
        item.name,
        item.count,
        `${item.percent}%`,
      ]),
      [],
      ["Booking Status Summary"],
      ["Status", "Count"],
      ...bookingStatusSummary.map((item) => [item.status, item.count]),
      [],
      ["Payment Status Summary"],
      ["Status", "Count"],
      ...paymentStatusSummary.map((item) => [item.status, item.count]),
      [],
      ["Upcoming Events"],
      [
        "Booking ID",
        "Client",
        "Event",
        "Date",
        "Time",
        "Package",
        "Photographer",
        "Videographer",
      ],
      ...upcomingEvents.map((event) => [
        event.id,
        event.client,
        event.event,
        event.date,
        event.time,
        event.packageName,
        event.photographer,
        event.videographer,
      ]),
      [],
      ["Staff Availability"],
      ["Name", "Role", "Status", "Note"],
      ...staffAvailability.map((staff) => [
        staff.name,
        staff.role,
        staff.status,
        staff.note,
      ]),
      [],
      ["Action Needed"],
      ["Category", "Title", "Description"],
      ...actionItems.map((item) => [item.tag, item.title, item.description]),
    ];

    const csvContent = reportRows
      .map((row) => row.map(formatCsvCell).join(","))
      .join("\n");

    const csvWithBom = `\uFEFF${csvContent}`;

    const blob = new Blob([csvWithBom], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeMonth = selectedMonth.replace(/\s+/g, "_");

    link.href = url;
    link.download = `SNAPSMART_Business_Report_${safeMonth}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <section className="admin-page dashboard-print-area">
      <div className="admin-page-header">
        <div>
          <p>Business Overview</p>
          <h2>Admin dashboard</h2>
          <span>
            Monitor booking trends, package demand, payment records, financial
            performance, booking status, and staff availability.
          </span>
        </div>

        <div className="dashboard-actions dashboard-print-hidden">
          <div className="dashboard-filter-group">
            <label>
              <span>Month</span>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Year</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="button" onClick={handleExportReport}>
            Export Report
          </button>

          <button type="button" onClick={handlePrintSummary}>
            Print Summary
          </button>
        </div>
      </div>

      <div className="dashboard-period-banner">
        <span>Selected Report Period</span>
        <strong>{selectedPeriod}</strong>
        <p>
          All displayed dashboard insights are shown as mock analytics for the
          selected month and year.
        </p>
      </div>

      <div className="dashboard-overview-grid">
        {overviewCards.map((card) => (
          <article key={card.label} className="dashboard-overview-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel dashboard-trend-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Booking Trends</span>
              <h3>Monthly booking performance</h3>
            </div>

            <strong>{trendPeriodLabel}</strong>
          </div>

          <div className="dashboard-bar-chart">
            {bookingTrends.map((trend) => (
              <div key={trend.month} className="dashboard-bar-column">
                <div className="dashboard-bar-track">
                  <div
                    className="dashboard-bar-fill"
                    style={{
                      height: `${(trend.bookings / highestBookingCount) * 100}%`,
                    }}
                  >
                    <span>{trend.bookings}</span>
                  </div>
                </div>

                <strong>{trend.month}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Financial Performance</span>
              <h3>Revenue overview</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-finance-grid">
            <article>
              <span>Total Expected Revenue</span>
              <strong>₱214,500</strong>
            </article>

            <article>
              <span>Verified Payments</span>
              <strong>₱148,000</strong>
            </article>

            <article>
              <span>Pending Verification</span>
              <strong>₱21,500</strong>
            </article>

            <article>
              <span>Remaining Balances</span>
              <strong>₱45,000</strong>
            </article>
          </div>
        </section>
      </div>

      <div className="dashboard-analytics-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Package Demand</span>
              <h3>Most booked packages</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-progress-list">
            {packageDemand.map((item) => (
              <article key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.count} bookings</span>
                </div>

                <div className="dashboard-progress-track">
                  <div
                    className="dashboard-progress-fill"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <p>{item.percent}% demand share</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Booking Status</span>
              <h3>Status breakdown</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-status-list">
            {bookingStatusSummary.map((item) => (
              <article key={item.status}>
                <span>{item.status}</span>
                <strong>{item.count}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Payment Records</span>
              <h3>Payment status summary</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-status-list">
            {paymentStatusSummary.map((item) => (
              <article key={item.status}>
                <span>{item.status}</span>
                <strong>{item.count}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-operations-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Upcoming Schedule</span>
              <h3>Upcoming events</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-event-list">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="dashboard-event-card">
                <div className="dashboard-event-top">
                  <span>{event.id}</span>
                  <strong>{event.event}</strong>
                </div>

                <h4>{event.client}</h4>

                <p>
                  {event.packageName} • {event.date} • {event.time}
                </p>

                <div className="dashboard-assignment-row">
                  <span>Photographer: {event.photographer}</span>
                  <span>Videographer: {event.videographer}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Staff Availability</span>
              <h3>This week</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-staff-list">
            {staffAvailability.map((staff) => (
              <article key={staff.name}>
                <div>
                  <strong>{staff.name}</strong>
                  <span>{staff.role}</span>
                  <p>{staff.note}</p>
                </div>

                <b className={getStaffStatusClass(staff.status)}>
                  {staff.status}
                </b>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Action Needed</span>
              <h3>Recent alerts</h3>
            </div>

            <strong>{selectedPeriod}</strong>
          </div>

          <div className="dashboard-action-list">
            {actionItems.map((item) => (
              <article key={item.title}>
                <div>
                  <span>{item.tag}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default AdminDashboard;