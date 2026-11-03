import { useEffect, useState } from "react";
import { useAuth } from "../auth/authContext";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ClientDirectory from "../admin/ClientDirectory";
import "./LiveRecords.css";

type Kind = "adminBookings" | "adminCalendar" | "adminClients" | "adminPayments" | "adminTeam" | "adminTasks" | "adminNotifications" | "clientBookings" | "clientNotifications";
type Row = Record<string, unknown>;
type Config = { title: string; table: string; columns: string; fields: [string, string][]; order: string; note: string };
const configs: Record<Kind, Config> = {
  adminBookings: { title: "Bookings", table: "bookings", columns: "id,client_name,event_type,event_date,status,total_amount,is_test", fields: [["is_test", "Test?"], ["client_name", "Client"], ["event_type", "Event"], ["event_date", "Date"], ["status", "Status"], ["total_amount", "Amount (₱)"]], order: "event_date", note: "Test confirmations are simulations, not real reservations. Real booking updates and payment verification are not connected yet." },
  adminCalendar: { title: "Calendar", table: "bookings", columns: "id,client_name,event_type,event_date,start_time,status,is_test", fields: [["is_test", "Test?"], ["event_date", "Event date"], ["start_time", "Start time"], ["client_name", "Client"], ["event_type", "Event"], ["status", "Status"]], order: "event_date", note: "Test bookings are not real reservations. Calendar editing and blocked dates are not connected yet." },
  adminClients: { title: "Clients", table: "profiles", columns: "id,full_name,phone,created_at", fields: [["full_name", "Client name"], ["phone", "Phone"], ["created_at", "Created"]], order: "created_at", note: "Showing registered client profiles. Walk-in clients without an account are not listed here." },
  adminPayments: { title: "Payments", table: "payments", columns: "id,booking_id,amount,method,status,created_at", fields: [["booking_id", "Booking ID"], ["amount", "Amount (₱)"], ["method", "Method"], ["status", "Status"], ["created_at", "Submitted"]], order: "created_at", note: "Payment proof review and verification are not connected yet." },
  adminTeam: { title: "Team members", table: "profiles", columns: "id,full_name,phone,role", fields: [["full_name", "Name"], ["role", "Role"], ["phone", "Phone"]], order: "full_name", note: "Showing registered photographer and videographer accounts. Availability and team management are not connected yet." },
  adminTasks: { title: "To-do list", table: "admin_tasks", columns: "id,title,description,due_date,priority,status", fields: [["title", "Task"], ["description", "Description"], ["due_date", "Due date"], ["priority", "Priority"], ["status", "Status"]], order: "created_at", note: "Task creation and updates are not connected yet." },
  adminNotifications: { title: "Notifications", table: "notifications", columns: "id,title,message,type,read_at,created_at", fields: [["title", "Title"], ["message", "Message"], ["type", "Type"], ["created_at", "Date"]], order: "created_at", note: "Showing notifications for your account. Mark as read is not connected yet." },
  clientBookings: { title: "My Bookings", table: "bookings", columns: "id,event_type,event_date,event_location,status,total_amount,is_test", fields: [["is_test", "Test?"], ["event_type", "Event"], ["event_date", "Date"], ["event_location", "Location"], ["status", "Status"], ["total_amount", "Amount (₱)"]], order: "event_date", note: "Test confirmations are simulations, not real reservations. Real payment verification and agreement viewing are not connected yet." },
  clientNotifications: { title: "Notifications", table: "notifications", columns: "id,title,message,type,created_at,read_at", fields: [["title", "Title"], ["message", "Message"], ["type", "Type"], ["created_at", "Date"]], order: "created_at", note: "Showing notifications for your account." },
};

export default function LiveRecords({ kind }: { kind: Kind }) {
  const { session } = useAuth();
  const config = configs[kind];
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [marking, setMarking] = useState("");
  const [markError, setMarkError] = useState("");
  const userId = session?.user.id;

  useEffect(() => {
    let active = true;
    async function load() {
      if (!userId) throw new Error("Please log in again.");
      const all: Row[] = [];
      for (let offset = 0; ; offset += 500) {
        let query = supabase.from(config.table).select(config.columns);
        if (kind === "adminClients") query = query.eq("role", "client");
        if (kind === "adminTeam") query = query.in("role", ["photographer", "videographer"]);
        if (kind === "clientBookings") query = query.eq("client_id", userId);
        if (kind === "clientNotifications" || kind === "adminNotifications") query = query.eq("recipient_id", userId);
        const { data, error: queryError } = await query.order(config.order, { ascending: kind === "adminCalendar" }).order("id").range(offset, offset + 499);
        if (queryError) throw queryError;
        const rows = (data ?? []) as unknown as Row[];
        all.push(...rows);
        if (rows.length < 500) break;
      }
      return all;
    }
    void load().then((data) => { if (active) { setRecords(data); setError(""); setLoading(false); } }).catch((failure: unknown) => { if (active) { setRecords([]); setError(failure instanceof Error ? failure.message : "Unable to load records."); setLoading(false); } });
    return () => { active = false; };
  }, [config, kind, userId, retry]);

  useEffect(() => {
    if (kind !== "clientNotifications") return;
    const refresh = () => setRetry((value) => value + 1);
    window.addEventListener("notifications-changed", refresh);
    return () => window.removeEventListener("notifications-changed", refresh);
  }, [kind]);

  async function markRead(id: string) {
    if (!userId || marking) return;
    setMarking(id); setMarkError("");
    try {
      const { error: rpcError } = await supabase.rpc("mark_notification_read", { notification_id: id });
      if (rpcError) throw new Error(rpcError.message);
      const { data, error: checkError } = await supabase.from("notifications").select("read_at").eq("id", id).eq("recipient_id", userId).maybeSingle();
      if (checkError || !data?.read_at) throw new Error("Could not confirm that the notification was marked as read. Please try again.");
      setRecords((items) => items.map((item) => item.id === id ? { ...item, read_at: data.read_at } : item));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (failure) { setMarkError(failure instanceof Error ? failure.message : "Could not mark notification as read."); }
    finally { setMarking(""); }
  }

  if (kind === "adminClients") return <ClientDirectory records={records} loading={loading} error={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} />;

  return <section className="live-records">
    <header><p>{kind.startsWith("admin") ? "ADMIN WORKSPACE" : "CLIENT PORTAL"}</p><h2>{config.title}</h2><span>{kind === "adminTeam" ? "Photographer and videographer accounts" : "Real records from Supabase"}</span></header>
    {kind !== "adminTeam" && kind !== "clientNotifications" && <div className="live-records-note">{config.note}</div>}
    {kind === "adminNotifications" && <Link to="/admin/payments">Open Payments to review submitted proofs</Link>}
    {markError && <p role="alert">{markError}</p>}
    {loading ? <p role="status">Loading records...</p> : error ? <div role="alert">Unable to load records: {error} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Try again</button></div> : records.length === 0 ? <div className="live-records-empty"><strong>No records yet</strong><p>When records are added to the database, they will appear here.</p></div> : <div className="live-records-table"><table><thead><tr>{config.fields.map(([, label]) => <th key={label}>{label}</th>)}{kind === "clientNotifications" && <th>Status</th>}</tr></thead><tbody>{records.map((record) => <tr key={String(record.id)}>{config.fields.map(([field]) => <td key={field}>{record[field] == null || record[field] === "" ? "—" : String(record[field])}</td>)}{kind === "clientNotifications" && <td>{record.read_at ? "Read" : <button type="button" disabled={!!marking} onClick={() => void markRead(String(record.id))}>{marking === record.id ? "Saving..." : "Mark as read"}</button>}</td>}</tr>)}</tbody></table></div>}
  </section>;
}
