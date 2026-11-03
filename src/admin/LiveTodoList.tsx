import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "./LiveTodoList.css";

type TaskStatus = "Pending" | "In Progress" | "Completed";
type Priority = "High" | "Medium" | "Low";
type Task = { id: string; title: string; description: string | null; due_date: string | null; priority: Priority; status: TaskStatus; created_at: string };
type TaskForm = { title: string; description: string; due_date: string; priority: Priority; status: TaskStatus };
const emptyForm = (): TaskForm => ({ title: "", description: "", due_date: "", priority: "Medium", status: "Pending" });

export default function LiveTodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState<TaskForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const all: Task[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: loadError } = await supabase.from("admin_tasks").select("id,title,description,due_date,priority,status,created_at").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
        if (loadError) throw loadError;
        all.push(...(data as Task[]));
        if (data.length < 500) break;
      }
      return all;
    }
    void load().then((data) => { if (active) { setTasks(data); setLoading(false); setError(""); } }).catch((failure: unknown) => { if (active) { setLoading(false); setError(failure instanceof Error ? failure.message : "Could not load tasks."); } });
    return () => { active = false; };
  }, [retry]);

  function openAdd() { setEditingId(null); setFormError(""); setNotice(""); setForm(emptyForm()); }
  function openEdit(task: Task) {
    setEditingId(task.id); setFormError(""); setNotice("");
    setForm({ title: task.title, description: task.description ?? "", due_date: task.due_date ?? "", priority: task.priority, status: task.status });
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || busy) return;
    const title = form.title.trim();
    if (!title) { setFormError("Please enter a task title."); return; }
    setBusy(true); setFormError("");
    try {
      const values = { title, description: form.description.trim() || null, due_date: form.due_date || null, priority: form.priority, status: form.status };
      const query = editingId ? supabase.from("admin_tasks").update(values).eq("id", editingId) : supabase.from("admin_tasks").insert(values);
      const { data, error: saveError } = await query.select("id,title,description,due_date,priority,status,created_at").single();
      if (saveError) throw saveError;
      setTasks((current) => editingId ? current.map((task) => task.id === editingId ? data as Task : task) : [data as Task, ...current]);
      setForm(null); setNotice(editingId ? "Task updated." : "Task added.");
    } catch (failure) { setFormError(failure instanceof Error ? failure.message : "Could not save the task."); }
    finally { setBusy(false); }
  }

  async function setCompleted(task: Task, completed: boolean) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: updateError } = await supabase.from("admin_tasks").update({ status: completed ? "Completed" : "Pending" }).eq("id", task.id).select("id,title,description,due_date,priority,status,created_at").single();
      if (updateError) throw updateError;
      setTasks((current) => current.map((item) => item.id === task.id ? data as Task : item));
      setNotice(completed ? "Task completed." : "Task marked pending.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not update the task."); }
    finally { setBusy(false); }
  }

  async function deleteTask(task: Task) {
    if (busy || !window.confirm(`Delete task “${task.title}”? This cannot be undone.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: deleteError } = await supabase.from("admin_tasks").delete().eq("id", task.id).select("id").single();
      if (deleteError || !data) throw deleteError ?? new Error("Task was not deleted.");
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotice("Task deleted.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not delete the task."); }
    finally { setBusy(false); }
  }

  const visible = tasks.filter((task) => filter === "All" || task.status === filter);
  return <section className="live-todo">
    <header className="live-todo-header"><div><p>ADMIN WORKSPACE</p><h2>To-do list</h2><span>Keep track of the little things that make every event happen.</span></div><button type="button" onClick={openAdd} disabled={busy}>+ Add task</button></header>
    <div className="live-todo-summary">{(["Pending", "In Progress", "Completed"] as TaskStatus[]).map((status) => <div key={status}><span>{status}</span><strong>{tasks.filter((task) => task.status === status).length}</strong><small>tasks</small></div>)}</div>
    {notice && <p className="live-todo-notice" role="status">{notice}</p>}
    {error && <div className="live-todo-error" role="alert">{error} {loading ? null : <button type="button" onClick={() => { setLoading(true); setError(""); setRetry((value) => value + 1); }}>Reload</button>}</div>}
    <div className="live-todo-panel"><div className="live-todo-panel-top"><div><span>YOUR TASKS</span><h3>All the details, in one place</h3></div><label>Filter<select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></label></div>
      {loading ? <p role="status">Loading tasks...</p> : error && tasks.length === 0 ? <p>Tasks could not be loaded.</p> : visible.length === 0 ? <div className="live-todo-empty"><strong>{tasks.length ? "No tasks match this filter" : "Your list is clear"}</strong><p>{tasks.length ? "Choose a different filter to see more tasks." : "Add a task to start organizing your work."}</p></div> : <ul className="live-todo-list">{visible.map((task) => <li key={task.id} className={task.status === "Completed" ? "is-completed" : ""}>
        <label className="live-todo-check"><input type="checkbox" checked={task.status === "Completed"} disabled={busy} onChange={(event) => void setCompleted(task, event.target.checked)} aria-label={`Mark ${task.title} ${task.status === "Completed" ? "pending" : "completed"}`} /></label>
        <div className="live-todo-copy"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<div className="live-todo-meta"><span className={`live-todo-priority ${task.priority.toLowerCase()}`}>{task.priority} priority</span><span>{task.status}</span>{task.due_date && <span>Due {task.due_date}</span>}</div></div>
        <div className="live-todo-actions"><button type="button" disabled={busy} onClick={() => openEdit(task)}>Edit</button><button type="button" disabled={busy} onClick={() => void deleteTask(task)}>Delete</button></div>
      </li>)}</ul>}
    </div>
    {form && <div className="live-todo-backdrop"><div className="live-todo-dialog" role="dialog" aria-modal="true" aria-labelledby="todo-form-title"><div className="live-todo-dialog-header"><div><p>YOUR TASKS</p><h3 id="todo-form-title">{editingId ? "Edit task" : "Add a task"}</h3></div><button type="button" aria-label="Close" disabled={busy} onClick={() => setForm(null)}>×</button></div>
      <form onSubmit={saveTask}><label>Task title<input autoFocus required maxLength={200} placeholder="e.g. Prepare the wedding gallery" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Description <span>(optional)</span><textarea maxLength={2000} rows={3} placeholder="Add any helpful details" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="live-todo-form-grid"><label>Due date <span>(optional)</span><input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label></div>{formError && <p className="live-todo-error" role="alert">{formError}</p>}<div className="live-todo-form-actions"><button type="button" disabled={busy} onClick={() => setForm(null)}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Saving..." : editingId ? "Save changes" : "Add task"}</button></div></form>
    </div></div>}
  </section>;
}
