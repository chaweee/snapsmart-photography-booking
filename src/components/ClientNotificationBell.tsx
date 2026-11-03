import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabase";
import "./ClientNotificationBell.css";

type Notification = { id: string; title: string; message: string; created_at: string; read_at: string | null };

export default function ClientNotificationBell() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    const [recent, unread] = await Promise.all([
      supabase.from("notifications").select("id,title,message,created_at,read_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", userId).is("read_at", null),
    ]);
    if (recent.error || unread.error) { setError("Could not load notifications. Please try again."); return; }
    setItems(recent.data ?? []); setCount(unread.count ?? 0); setError("");
  }, [userId]);

  useEffect(() => {
    void Promise.resolve().then(load);
    const timer = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("notifications-changed", onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", onFocus); window.removeEventListener("notifications-changed", onFocus); };
  }, [load]);

  async function markRead(item: Notification) {
    if (!userId || item.read_at || marking) return;
    setMarking(item.id); setError("");
    try {
      const { error: markError } = await supabase.rpc("mark_notification_read", { notification_id: item.id });
      if (markError) throw new Error(markError.message);
      const { data, error: checkError } = await supabase.from("notifications").select("read_at").eq("id", item.id).eq("recipient_id", userId).maybeSingle();
      if (checkError || !data?.read_at) throw new Error("Could not confirm that the notification was marked as read. Please try again.");
      await load();
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not mark as read."); }
    finally { setMarking(""); }
  }

  return <div className="client-bell-container" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
    <button className="client-bell-button" type="button" aria-label={`Notifications${count ? `, ${count} unread` : ""}`} aria-expanded={open} aria-controls="client-notification-panel" onClick={() => { setOpen((current) => !current); void load(); }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
      {count > 0 && <span className="client-bell-badge">{count > 99 ? "99+" : count}</span>}
    </button>
    {open && <div className="client-bell-panel" id="client-notification-panel">
      <div className="client-bell-heading"><div><strong>Notifications</strong><span>{count} unread</span></div><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}>×</button></div>
      {error && <p className="client-bell-empty" role="alert">{error}</p>}
      {!error && items.length === 0 && <p className="client-bell-empty">No notifications yet.</p>}
      <ul className="client-bell-list">{items.map((item) => <li key={item.id} className={item.read_at ? "" : "unread"}><div className="client-bell-item-title"><strong>{item.title}</strong>{!item.read_at && <span>New</span>}</div><p>{item.message}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>{!item.read_at && <button className="client-bell-read" type="button" disabled={!!marking} onClick={() => void markRead(item)}>{marking === item.id ? "Saving..." : "Mark as read"}</button>}</li>)}</ul>
      <Link className="client-bell-view-all" to="/client/notifications" onClick={() => setOpen(false)}>View all notifications →</Link>
    </div>}
  </div>;
}
