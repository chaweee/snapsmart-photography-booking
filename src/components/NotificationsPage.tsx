import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabase";
import "./NotificationsPage.css";

type Notification = { id: string; title: string; message: string; type: string; created_at: string; read_at: string | null };

export default function NotificationsPage({ mode }: { mode: "admin" | "client" }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!userId) throw new Error("Please log in again.");
      const rows: Notification[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: loadError } = await supabase.from("notifications").select("id,title,message,type,created_at,read_at").eq("recipient_id", userId).order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
        if (loadError) throw new Error(loadError.message);
        rows.push(...data);
        if (data.length < 500) break;
      }
      return rows;
    }
    void load().then((rows) => { if (active) { setItems(rows); setError(""); setLoading(false); } }).catch((failure: unknown) => { if (active) { setError(failure instanceof Error ? failure.message : "Could not load notifications."); setLoading(false); } });
    return () => { active = false; };
  }, [userId, revision]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("notifications-changed", refresh);
    return () => window.removeEventListener("notifications-changed", refresh);
  }, []);

  async function markRead(item: Notification) {
    if (!userId || marking || item.read_at) return;
    setMarking(item.id); setError("");
    try {
      const { error: markError } = await supabase.rpc("mark_notification_read", { notification_id: item.id });
      if (markError) throw new Error(markError.message);
      const { data, error: checkError } = await supabase.from("notifications").select("read_at").eq("id", item.id).eq("recipient_id", userId).maybeSingle();
      if (checkError || !data?.read_at) throw new Error("Could not confirm that the notification was marked as read.");
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, read_at: data.read_at } : row));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not mark notification as read."); }
    finally { setMarking(""); }
  }
  const unread = items.filter((item) => !item.read_at).length;
  const shown = filter === "unread" ? items.filter((item) => !item.read_at) : items;

  return <section className="notifications-page"><header className="notifications-page-header"><div><p>{mode === "admin" ? "ADMIN WORKSPACE" : "CLIENT PORTAL"}</p><h2>Notifications</h2><span>{mode === "admin" ? "Keep up with booking and payment updates." : "Your booking, payment, and gallery updates in one place."}</span></div>{!loading && !error && <div className="notifications-count"><strong>{unread}</strong><span>unread</span></div>}</header>
    {error && <div className="notifications-error" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Try again</button></div>}
    <div className="notifications-panel"><div className="notifications-toolbar"><div><span>YOUR UPDATES</span><h3>Activity</h3></div><div className="notifications-filters"><button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button><button type="button" aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>Unread{!loading && !error ? ` (${unread})` : ""}</button></div></div>
      {loading ? <p className="notifications-empty" role="status">Loading notifications...</p> : error && !items.length ? <p className="notifications-empty">Notifications could not be loaded.</p> : !shown.length ? <div className="notifications-empty"><strong>{filter === "unread" ? "You're all caught up" : "No notifications yet"}</strong><p>{filter === "unread" ? "There are no unread updates." : "Your updates will appear here when available."}</p></div> : <ul className="notifications-list">{shown.map((item) => <li className={!item.read_at ? "notification-row unread" : "notification-row"} key={item.id}><div className="notification-symbol" aria-hidden="true">{item.type === "payment" ? "₱" : item.type === "gallery" ? "▧" : "✦"}</div><div className="notification-content"><div className="notification-title"><strong>{item.title}</strong>{!item.read_at && <span>New</span>}</div><p>{item.message}</p><div className="notification-meta"><time dateTime={item.created_at}>{Number.isNaN(new Date(item.created_at).getTime()) ? "—" : new Date(item.created_at).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time><span>·</span><span>{item.type}</span></div></div><div className="notification-actions">{mode === "admin" && item.type === "payment" && <Link to="/admin/payments">View payments</Link>}{!item.read_at ? <button type="button" disabled={!!marking} onClick={() => void markRead(item)}>{marking === item.id ? "Saving..." : "Mark as read"}</button> : <span>Read</span>}</div></li>)}</ul>}
    </div>
  </section>;
}
