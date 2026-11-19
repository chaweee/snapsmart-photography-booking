import { Link } from "react-router-dom";
import "./DashboardBreakdown.css";

// Every booking status, in the order shown in the legend, with its chart color.
const STATUSES: Array<{ status: string; label: string; color: string }> = [
  { status: "Confirmed", label: "Confirmed", color: "#8a6a52" },
  { status: "Completed", label: "Completed", color: "#5f7d55" },
  { status: "Awaiting Payment Verification", label: "Awaiting payment", color: "#d9a441" },
  { status: "Payment Insufficient", label: "Payment insufficient", color: "#c47a5a" },
  { status: "Pending", label: "Pending", color: "#b8a596" },
  { status: "Cancelled", label: "Cancelled", color: "#cfc6be" },
];
const OTHER_COLOR = "#9a8f86";

const percent = (count: number, total: number) => (total ? Math.round((count / total) * 100) : 0);

/** Booking status: donut chart with the total in the middle, plus a legend with counts and shares. */
export function BookingStatusPanel({ statusCounts, total, periodLabel, pendingPayments }: {
  statusCounts: Array<[string, number]>;
  total: number;
  periodLabel: string;
  pendingPayments: number;
}) {
  const counts = new Map(statusCounts);
  // Known statuses always appear (zero ones faded); any unexpected status is listed after them.
  const rows = [
    ...STATUSES.map((item) => ({ ...item, count: counts.get(item.status) ?? 0 })),
    ...statusCounts.filter(([status]) => !STATUSES.some((item) => item.status === status)).map(([status, count]) => ({ status, label: status, color: OTHER_COLOR, count })),
  ];

  // Donut segments: each circle draws its share of a 100-unit ring, starting where the previous one ended.
  let offset = 0;
  const segments = rows.filter((row) => row.count > 0).map((row) => {
    const length = (row.count / total) * 100;
    const segment = { ...row, length, offset };
    offset += length;
    return segment;
  });
  const summary = rows.filter((row) => row.count > 0).map((row) => `${row.count} ${row.label.toLowerCase()}`).join(", ");

  return (
    <section className="live-dashboard-panel breakdown-panel">
      <div className="breakdown-heading">
        <div><span className="breakdown-eyebrow">BREAKDOWN</span><h3>Booking status</h3></div>
        <span className="breakdown-period">{periodLabel}</span>
      </div>
      {total === 0 ? <p className="live-empty">No bookings found for this period. The chart will appear when booking data is available.</p> : <>
        <div className="status-overview">
          <svg className="status-donut" viewBox="0 0 42 42" role="img" aria-label={`${total} bookings: ${summary}`}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#efe8e1" strokeWidth="5" />
            {segments.map((segment) => (
              <circle key={segment.status} cx="21" cy="21" r="15.9" fill="none" stroke={segment.color} strokeWidth="5" pathLength={100}
                strokeDasharray={`${segment.length} ${100 - segment.length}`} strokeDashoffset={25 - segment.offset} />
            ))}
            <text x="21" y="21.5" textAnchor="middle" className="status-donut-total">{total}</text>
            <text x="21" y="27" textAnchor="middle" className="status-donut-label">{total === 1 ? "BOOKING" : "BOOKINGS"}</text>
          </svg>
          <ul className="status-legend">
            {rows.map((row) => (
              <li key={row.status} className={row.count ? undefined : "is-empty"}>
                <span className="status-swatch" style={{ background: row.color }} aria-hidden="true" />
                <span className="status-name">{row.label}</span>
                <strong>{row.count}</strong>
                <span className="status-share">{percent(row.count, total)}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`breakdown-note${pendingPayments ? " needs-action" : ""}`}>
          {pendingPayments
            ? <><span aria-hidden="true">!</span>{pendingPayments} {pendingPayments === 1 ? "payment is" : "payments are"} waiting for review. <Link to="/admin/payments">Review payments →</Link></>
            : <><span aria-hidden="true">✓</span>No payments waiting for review</>}
        </div>
      </>}
    </section>
  );
}

/** Package demand: the most-booked package highlighted, then the rest ranked with counts, shares and bars. */
export function PackageDemandPanel({ packageCounts, total }: { packageCounts: Array<[string, number]>; total: number }) {
  const [top, ...rest] = packageCounts;
  return (
    <section className="live-dashboard-panel breakdown-panel">
      <div className="breakdown-heading">
        <div><span className="breakdown-eyebrow">POPULAR CHOICES</span><h3>Package demand</h3></div>
        {packageCounts.length > 0 && <span className="breakdown-count">{packageCounts.length} {packageCounts.length === 1 ? "package" : "packages"}</span>}
      </div>
      {!top ? <p className="live-empty">Package demand will appear when bookings are available.</p> : <>
        <div className="package-top">
          <span className="package-top-icon" aria-hidden="true">★</span>
          <div className="package-top-name"><span>MOST BOOKED</span><strong>{top[0]}</strong></div>
          <div className="package-top-count"><strong>{top[1]}</strong><span>{percent(top[1], total)}% of bookings</span></div>
        </div>
        {rest.length > 0 && <ol className="package-rank" start={2}>
          {rest.map(([name, count], index) => (
            <li key={name}>
              <div className="package-rank-row">
                <span className="package-rank-number">{index + 2}</span>
                <span className="package-rank-name">{name}</span>
                <strong>{count}</strong>
                <span className="package-rank-share">{percent(count, total)}%</span>
              </div>
              <div className="package-rank-track" aria-hidden="true">
                <div className={index === 0 ? "package-rank-bar is-second" : "package-rank-bar"} style={{ width: `${(count / top[1]) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>}
      </>}
    </section>
  );
}
