import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabase";
import "./PhotographerPortal.css";
import "./TeamPortal.css";

type Assignment = { booking_id: string; assignment_role: string; bookings: { client_name: string; client_phone: string | null; event_type: string; other_event_type: string | null; event_date: string; start_time: string | null; end_time: string | null; event_location: string; church_location: string | null; theme_motif: string | null; status: string; is_test: boolean; package_snapshot: { name?: string } | null } | null };
type Task = { id: string; title: string; is_completed: boolean };
type Notification = { id: string; title: string; message: string; created_at: string; read_at: string | null };

export default function TeamPortal() {
  const { session, role } = useAuth();
  const userId = session?.user.id;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationError, setNotificationError] = useState("");
  const [notificationBusy, setNotificationBusy] = useState("");
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function load() {
      const [profile, schedule, checklist, alerts] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", userId).single(),
        supabase.from("booking_assignments").select("booking_id,assignment_role,bookings(client_name,client_phone,event_type,other_event_type,event_date,start_time,end_time,event_location,church_location,theme_motif,status,is_test,package_snapshot)").eq("team_member_id", userId).order("booking_id"),
        supabase.from("team_tasks").select("id,title,is_completed").eq("team_member_id", userId).order("created_at", { ascending: false }),
        supabase.from("notifications").select("id,title,message,created_at,read_at").eq("recipient_id", userId).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      if (!profile.error) setName(profile.data.full_name);
      if (schedule.error) setScheduleError(schedule.error.message);
      else { setAssignments((schedule.data ?? []) as unknown as Assignment[]); setScheduleError(""); }
      if (checklist.error) setTaskError(checklist.error.message);
      else { setTasks(checklist.data ?? []); setTaskError(""); }
      if (alerts.error) setNotificationError(alerts.error.message);
      else { setNotifications(alerts.data ?? []); setNotificationError(""); }
      setLoading(false);
    }
    void load().catch(() => { if (active) { setScheduleError("Unable to load your account. Please try again."); setTaskError("Unable to load tasks."); setLoading(false); } });
    return () => { active = false; };
  }, [userId, retry]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => setRetry((value) => value + 1);
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [userId]);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || busy || !title.trim()) return;
    setBusy(true); setTaskError("");
    try {
      const { data, error } = await supabase.from("team_tasks").insert({ team_member_id: userId, title: title.trim() }).select("id,title,is_completed").single();
      if (error) throw error;
      setTasks((current) => [data, ...current]); setTitle("");
    } catch (error) { setTaskError(error instanceof Error ? error.message : "Unable to add task."); }
    finally { setBusy(false); }
  }

  async function updateTask(task: Task, completed: boolean) {
    if (busy) return;
    setBusy(true); setTaskError("");
    try {
      const { data, error } = await supabase.from("team_tasks").update({ is_completed: completed }).eq("id", task.id).select("id,title,is_completed").single();
      if (error) throw error;
      setTasks((current) => current.map((item) => item.id === task.id ? data : item));
    } catch (error) { setTaskError(error instanceof Error ? error.message : "Unable to update task."); }
    finally { setBusy(false); }
  }

  async function removeTask(task: Task) {
    if (busy || !window.confirm(`Delete “${task.title}”?`)) return;
    setBusy(true); setTaskError("");
    try {
      const { error } = await supabase.from("team_tasks").delete().eq("id", task.id).select("id").single();
      if (error) throw error;
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (error) { setTaskError(error instanceof Error ? error.message : "Unable to delete task."); }
    finally { setBusy(false); }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) window.alert("Could not log out. Please try again.");
    else navigate("/login");
  }

  async function markRead(notification: Notification) {
    if (notification.read_at || notificationBusy) return;
    setNotificationBusy(notification.id); setNotificationError("");
    try {
      const { error } = await supabase.rpc("mark_notification_read", { notification_id: notification.id });
      if (error) throw error;
      const { data, error: readError } = await supabase.from("notifications").select("id,title,message,created_at,read_at").eq("id", notification.id).single();
      if (readError) throw readError;
      setNotifications((current) => current.map((item) => item.id === notification.id ? data : item));
    } catch (error) { setNotificationError(error instanceof Error ? error.message : "Could not mark notification as read."); }
    finally { setNotificationBusy(""); }
  }

  const schedule = [...assignments].filter((assignment) => assignment.bookings).sort((a, b) => (a.bookings?.event_date ?? "").localeCompare(b.bookings?.event_date ?? ""));
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const selectedEvents = selectedDate ? schedule.filter((assignment) => assignment.bookings?.event_date === selectedDate) : schedule;
  return <div className="photographer-portal-page team-portal">
    <header className="team-portal-header"><div><strong>SNAPSMART</strong><span>TEAM PORTAL</span></div><a href="#team-notifications" aria-label={`Notifications, ${notifications.filter((item) => !item.read_at).length} unread`}>Notifications ({notifications.filter((item) => !item.read_at).length})</a><button type="button" onClick={() => void logout()}>Log out</button></header>
    <main className="photographer-portal-main team-portal-main">
      <section className="photographer-hero"><div><p>MY WORKSPACE</p><h1>My schedule</h1><span>Your assigned events and personal to-do list, all in one place.</span></div><div className="photographer-profile-card"><div className="photographer-profile-avatar">{(name || "T").charAt(0).toUpperCase()}</div><div><strong>{name || "Team member"}</strong><span>{role === "videographer" ? "Videographer" : "Photographer"}</span></div></div></section>
      <section className="team-portal-summary"><article><span>ASSIGNED EVENTS</span><strong>{loading ? "—" : schedule.length}</strong><p>visible to your account</p></article><article><span>TO-DO</span><strong>{loading ? "—" : tasks.filter((task) => !task.is_completed).length}</strong><p>tasks left to complete</p></article></section>
      <section className="team-panel team-calendar"><div className="team-section-top"><div className="photographer-section-heading"><div><p>CALENDAR</p><h2>{month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</h2></div></div><div className="team-calendar-controls"><button type="button" aria-label="Previous month" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); setSelectedDate(""); }}>←</button><button type="button" aria-label="Next month" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); setSelectedDate(""); }}>→</button></div></div>
        {loading ? <p>Loading calendar...</p> : scheduleError ? <p role="alert">Calendar unavailable: {scheduleError}</p> : <><div className="team-calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <strong className="team-calendar-weekday" key={day}>{day}</strong>)}{Array.from({ length: startWeekday }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; const date = `${monthPrefix}-${String(day).padStart(2, "0")}`; const count = schedule.filter((item) => item.bookings?.event_date === date).length; return <button type="button" key={date} aria-pressed={selectedDate === date} aria-label={`${date}: ${count} assigned events`} className={`${count ? "has-events " : ""}${selectedDate === date ? "selected" : ""}`} onClick={() => setSelectedDate(selectedDate === date ? "" : date)}><span>{day}</span>{count > 0 && <small>{count} {count === 1 ? "event" : "events"}</small>}</button>; })}</div><p className="team-helper">Select a date to see its events below. Select it again to show all assignments.</p></>}
      </section>
      <div className="team-portal-columns"><section className="team-panel"><div className="photographer-section-heading"><div><p>SCHEDULE</p><h2>My assigned events</h2></div></div>
        {loading ? <p>Loading your schedule...</p> : scheduleError ? <p role="alert">Could not load schedule: {scheduleError} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Retry</button></p> : selectedEvents.length === 0 ? <p className="team-empty">{selectedDate ? `No assigned events on ${selectedDate}.` : "No events have been assigned to you yet."}</p> : <div className="photographer-assignment-list">{selectedEvents.map(({ booking_id, assignment_role, bookings }) => bookings && <article className="team-event" key={`${booking_id}-${assignment_role}`}><span>{bookings.is_test ? "TEST · " : ""}{bookings.event_date} · {bookings.status}</span><h3>{bookings.other_event_type || bookings.event_type}</h3>{bookings.is_test && <p>This is a simulated event, not a real booking.</p>}<p><strong>Client:</strong> {bookings.client_name}</p><p><strong>Time:</strong> {bookings.start_time?.slice(0, 5) ?? "Not set"}{bookings.end_time ? ` – ${bookings.end_time.slice(0, 5)}` : ""}</p><p><strong>{bookings.event_type === "Wedding" ? "Reception" : "Event address"}:</strong> {bookings.event_location}</p>{bookings.event_type === "Wedding" && bookings.church_location && <p><strong>Church location:</strong> {bookings.church_location}</p>}{bookings.client_phone && <p><strong>Contact:</strong> {bookings.client_phone}</p>}{bookings.package_snapshot?.name && <p><strong>Package:</strong> {bookings.package_snapshot.name}</p>}{bookings.theme_motif && <p><strong>Theme:</strong> {bookings.theme_motif}</p>}</article>)}</div>}
      </section><section className="team-panel"><div className="photographer-section-heading"><div><p>PERSONAL CHECKLIST</p><h2>My to-do</h2></div></div><p className="team-helper">Only you can see and manage this checklist. It is separate from the admin to-do list.</p>
        <form className="team-task-form" onSubmit={addTask}><label className="team-sr-only" htmlFor="team-task-title">New task</label><input id="team-task-title" value={title} maxLength={200} placeholder="Add a task..." onChange={(event) => setTitle(event.target.value)} /><button disabled={busy || !title.trim() || loading} type="submit">Add</button></form>
        {taskError && <p role="alert">Could not save or load tasks: {taskError} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Retry</button></p>}
        {loading ? <p>Loading tasks...</p> : tasks.length === 0 ? <p className="team-empty">No tasks yet. Add one above.</p> : <ul className="team-task-list">{tasks.map((task) => <li key={task.id}><label><input type="checkbox" checked={task.is_completed} disabled={busy} onChange={(event) => void updateTask(task, event.target.checked)} /><span className={task.is_completed ? "completed" : ""}>{task.title}</span></label><button type="button" disabled={busy} onClick={() => void removeTask(task)}>Delete</button></li>)}</ul>}
      </section></div>
      <section id="team-notifications" className="team-panel team-notifications"><div className="photographer-section-heading"><div><p>UPDATES</p><h2>Notifications</h2></div></div><p className="team-helper">Assignment and schedule updates refresh automatically while this page is open.</p>{notificationError && <p role="alert">{notificationError} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Retry</button></p>}{loading ? <p>Loading notifications...</p> : !notificationError && notifications.length === 0 ? <p className="team-empty">No notifications yet.</p> : <ul className="team-notification-list">{notifications.map((notification) => <li key={notification.id}><div><strong>{notification.title}</strong>{!notification.read_at && <span className="team-unread">Unread</span>}<p>{notification.message}</p><small>{new Date(notification.created_at).toLocaleString()}</small></div>{!notification.read_at && <button type="button" disabled={!!notificationBusy} onClick={() => void markRead(notification)}>Mark read</button>}</li>)}</ul>}</section>
    </main>
  </div>;
}
