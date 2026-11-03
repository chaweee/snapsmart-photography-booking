import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Admin.css";
import "./LiveDashboard.css";

type Booking = { id: string; client_name: string; event_type: string; event_date: string; start_time: string | null; status: string; total_amount: number; package_snapshot: { name?: string } | null; package_id: string | null };
type Payment = { id: string; booking_id: string; amount: number; status: string };
type Report = { period: string; bookings: Booking[]; payments: Payment[] };
const pageSize = 500;
const peso = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(amount);
const safeCsv = (value: string | number) => {
  const text = String(value);
  const safe = /^[\s]*[=+\-@]/.test(text) || (text.length > 0 && text.charCodeAt(0) < 32) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

async function loadReport(period: string): Promise<Report> {
  const [year, month] = period.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const bookings: Booking[] = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from("bookings").select("id, client_name, event_type, event_date, start_time, status, total_amount, package_snapshot, package_id").eq("is_test", false);
    if (period) query = query.gte("event_date", `${period}-01`).lt("event_date", end);
    const { data, error } = await query.order("id").range(offset, offset + pageSize - 1);
    if (error) throw error;
    bookings.push(...(data as Booking[]));
    if (data.length < pageSize) break;
  }
  const payments: Payment[] = [];
  for (let start = 0; start < bookings.length; start += 100) {
    const ids = bookings.slice(start, start + 100).map((booking) => booking.id);
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from("payments").select("id, booking_id, amount, status").in("booking_id", ids).order("id").range(offset, offset + pageSize - 1);
      if (error) throw error;
      payments.push(...(data as Payment[]));
      if (data.length < pageSize) break;
    }
  }
  return { period, bookings, payments };
}

export default function LiveDashboard() {
  const [period, setPeriod] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    void loadReport(period).then((result) => { if (active) { setReport(result); setError(""); } }).catch((failure: unknown) => { if (active) { setReport(null); setError(failure instanceof Error ? failure.message : "Unable to load the report."); } });
    return () => { active = false; };
  }, [period, retry]);

  const ready = report?.period === period && !error;
  const summary = useMemo(() => {
    const bookings = ready ? report.bookings : [];
    const payments = ready ? report.payments : [];
    const statusCounts = new Map<string, number>();
    const packageCounts = new Map<string, number>();
    for (const booking of bookings) {
      statusCounts.set(booking.status, (statusCounts.get(booking.status) ?? 0) + 1);
      const name = booking.package_snapshot?.name || booking.package_id || "Unspecified";
      packageCounts.set(name, (packageCounts.get(name) ?? 0) + 1);
    }
    const verified = payments.filter((payment) => payment.status === "Verified").reduce((sum, payment) => sum + Number(payment.amount), 0);
    const pending = payments.filter((payment) => payment.status === "For Verification");
    const total = bookings.reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    return { bookings, payments, verified, pending, total, statusCounts: [...statusCounts], packageCounts: [...packageCounts].sort((a, b) => b[1] - a[1]) };
  }, [ready, report]);

  const periodLabel = period ? new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" }) : "All event dates";
  const cards = [
    { label: "Bookings", value: String(summary.bookings.length), note: period ? "Events scheduled in this month" : "Events across all dates" },
    { label: "Verified payments", value: peso(summary.verified), note: "For these bookings, at any date" },
    { label: "For verification", value: String(summary.pending.length), note: "Payment records awaiting review" },
    { label: "Confirmed events", value: String(summary.bookings.filter((booking) => booking.status === "Confirmed").length), note: period ? "Confirmed events this month" : "Confirmed events across all dates" },
  ];

  function exportReport() {
    if (!ready) return;
    const rows: (string | number)[][] = [
      ["SNAPSMART Dashboard Summary"], ["Event period", periodLabel], ["Generated", new Date().toLocaleString()],
      ["Scope", "Payments for bookings in the selected event period, regardless of payment date; test bookings excluded"], [],
      ["Metric", "Value"], ...cards.map((card) => [card.label, card.value]),
      ["Total booked value (including cancelled bookings)", peso(summary.total)], [],
      ["Booking status", "Count"], ...summary.statusCounts, [], ["Package", "Bookings"], ...summary.packageCounts, [],
      ["Booking ID", "Client", "Event", "Event date", "Start time", "Package", "Status", "Booked amount"],
      ...summary.bookings.map((booking) => [booking.id, booking.client_name, booking.event_type, booking.event_date, booking.start_time ?? "", booking.package_snapshot?.name || booking.package_id || "Unspecified", booking.status, Number(booking.total_amount)]),
    ];
    const blob = new Blob(["\uFEFF", rows.map((row) => row.map(safeCsv).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `SnapSmart-summary-${period || "all-dates"}.csv`; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="live-dashboard dashboard-print-area">
    <header className="live-dashboard-header"><div><p>BUSINESS OVERVIEW</p><h2>Admin dashboard</h2><span>A clear view of your bookings and payments.</span></div><div className="live-dashboard-controls dashboard-print-hidden"><label>Event month<input type="month" value={period} min="2000-01" max="9998-12" onChange={(event) => { setError(""); setPeriod(event.target.value); }} /></label>{period && <button type="button" onClick={() => { setError(""); setPeriod(""); }}>All dates</button>}<button type="button" disabled={!ready} onClick={exportReport}>Export CSV</button><button type="button" disabled={!ready} onClick={() => window.print()}>Print summary</button></div></header>
    <div className="live-period"><div><span>REPORT PERIOD</span><strong>{periodLabel}</strong></div></div>
    {error ? <div className="live-dashboard-error" role="alert">Could not load dashboard: {error} <button type="button" onClick={() => { setError(""); setReport(null); setRetry((value) => value + 1); }}>Try again</button></div> : !ready ? <p role="status">Loading dashboard...</p> : <>
      <div className="live-dashboard-cards">{cards.map((card) => <article key={card.label}><span>{card.label}</span><strong>{card.value}</strong><p>{card.note}</p></article>)}</div>
      <div className="live-dashboard-grid">
        <section className="live-dashboard-panel"><div className="live-panel-heading"><div><span>BREAKDOWN</span><h3>Booking status</h3></div><strong>{summary.bookings.length} total</strong></div>{summary.statusCounts.length ? <div className="live-chart-list">{summary.statusCounts.map(([status, count]) => <div className="live-chart-row" key={status}><div><span>{status}</span><strong>{count}</strong></div><div className="live-chart-track" aria-hidden="true"><div className="live-chart-bar" style={{ width: `${count / summary.bookings.length * 100}%` }} /></div></div>)}</div> : <p className="live-empty">No bookings found for this period. The chart will appear when booking data is available.</p>}</section>
        <section className="live-dashboard-panel"><div className="live-panel-heading"><div><span>POPULAR CHOICES</span><h3>Package demand</h3></div></div>{summary.packageCounts.length ? <div className="live-chart-list">{summary.packageCounts.map(([name, count]) => <div className="live-chart-row" key={name}><div><span>{name}</span><strong>{count}</strong></div><div className="live-chart-track" aria-hidden="true"><div className="live-chart-bar" style={{ width: `${count / summary.bookings.length * 100}%` }} /></div></div>)}</div> : <p className="live-empty">Package demand will appear when bookings are available.</p>}</section>
        <section className="live-dashboard-panel live-dashboard-wide"><div className="live-panel-heading"><div><span>{period ? "EVENTS THIS MONTH" : "ALL EVENTS"}</span><h3>Scheduled bookings</h3></div><strong>{summary.bookings.length} bookings</strong></div>{summary.bookings.length ? <div className="live-table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Event</th><th>Package</th><th>Status</th></tr></thead><tbody>{[...summary.bookings].sort((a, b) => a.event_date.localeCompare(b.event_date)).map((booking) => <tr key={booking.id}><td>{booking.event_date}</td><td>{booking.client_name}</td><td>{booking.event_type}</td><td>{booking.package_snapshot?.name || booking.package_id || "Unspecified"}</td><td>{booking.status}</td></tr>)}</tbody></table></div> : <p className="live-empty">No scheduled bookings yet.</p>}</section>
        <section className="live-dashboard-panel live-dashboard-wide"><div className="live-panel-heading"><div><span>FINANCIAL CONTEXT</span><h3>Booked value</h3></div><strong>{peso(summary.total)}</strong></div><p className="live-empty">Total booking amounts for the selected event period, including cancelled bookings. This is not revenue or an outstanding balance. Only payment records marked Verified are counted as verified payments.</p></section>
      </div>
    </>}
  </section>;
}
