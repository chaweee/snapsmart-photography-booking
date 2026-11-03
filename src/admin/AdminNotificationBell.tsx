import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabase";
import "./AdminNotificationBell.css";

type Notification = { id: string; title: string; message: string; type: string; read_at: string | null; created_at: string };

export default function AdminNotificationBell() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    const [recent, unread] = await Promise.all([
      supabase.from("notifications").select("id,title,message,type,read_at,created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", userId).is("read_at", null),
    ]);
    if (recent.error || unread.error) { setError("Could not load notifications."); return; }
    setNotifications(recent.data ?? []);
    setUnreadCount(unread.count ?? 0);
    setError("");
  }, [userId]);

  useEffect(() => {
    // Initial and periodic refresh use the logged-in admin's own recipient ID.
    void Promise.resolve().then(load);
    const interval = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("notifications-changed", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); window.removeEventListener("notifications-changed", onFocus); };
  }, [load]);

  async function markRead(notification: Notification) {
    if (!userId || marking || notification.read_at) return;
    setMarking(notification.id); setError("");
    try {
      const { error: updateError } = await supabase.rpc("mark_notification_read", { notification_id: notification.id });
      if (updateError) throw new Error(updateError.message);
      const { data, error: checkError } = await supabase.from("notifications").select("read_at").eq("id", notification.id).eq("recipient_id", userId).maybeSingle();
      if (checkError || !data?.read_at) throw new Error("Could not confirm that the notification was marked as read.");
      await load();
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not mark notification as read."); }
    finally { setMarking(""); }
  }

  return <div className="admin-bell-container">
    <button className="admin-bell-button" type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open} aria-controls="admin-notification-panel" onClick={() => { setOpen((current) => !current); void load(); }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
      {unreadCount > 0 && <span className="admin-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && <div className="admin-bell-panel" id="admin-notification-panel">
      <div className="admin-bell-heading"><div><strong>Notifications</strong><span>{unreadCount} unread</span></div><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}>×</button></div>
      {error && <p className="admin-bell-empty" role="alert">{error}</p>}
      {!error && notifications.length === 0 && <p className="admin-bell-empty">No notifications yet.</p>}
      <ul className="admin-bell-list">{notifications.map((notification) => <li key={notification.id} className={notification.read_at ? "" : "unread"}>
        <div className="admin-bell-item-title"><strong>{notification.title}</strong>{!notification.read_at && <span>New</span>}</div>
        <p>{notification.message}</p><time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time>
        <div className="admin-bell-item-actions">{notification.type === "payment" && <Link to="/admin/payments" onClick={() => setOpen(false)}>View payments</Link>}{!notification.read_at && <button type="button" disabled={!!marking} onClick={() => void markRead(notification)}>{marking === notification.id ? "Saving..." : "Mark read"}</button>}</div>
      </li>)}</ul>
      <Link className="admin-bell-view-all" to="/admin/notifications" onClick={() => setOpen(false)}>View all notifications →</Link>
    </div>}
  </div>;
}
