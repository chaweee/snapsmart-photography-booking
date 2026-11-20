import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useToastMessage } from "../lib/toast";
import Pagination from "../components/Pagination";
import { clampPage, pageSlice } from "../lib/pagination";
import { EMAIL_ERROR, emailInputProps, filterEmailInput, filterNameInput, findNameError, isValidEmail, nameInputProps } from "../lib/validation";
import "./TeamDirectory.css";

type Member = { id: string; full_name: string; phone: string | null; role: "photographer" | "videographer" };

function AddTeamMember({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) { setError("Passwords do not match."); return; }
    const fullName = String(form.get("fullName") ?? "").trim();
    if (!fullName) { setError("Enter the team member's name."); return; }
    const nameError = findNameError([["Full name", fullName]]);
    if (nameError) { setError(nameError); return; }
    if (!isValidEmail(String(form.get("email") ?? ""))) { setError(EMAIL_ERROR); return; }
    setBusy(true); setError("");
    try {
      const { error: invokeError } = await supabase.functions.invoke("create-team-member", { body: { full_name: fullName, email: String(form.get("email") ?? "").trim(), phone, role: form.get("role"), password } });
      if (invokeError) {
        let detail = "Could not create the account. Check existing accounts before retrying.";
        if (invokeError.context instanceof Response) {
          const response = await invokeError.context.json().catch(() => null);
          if (typeof response?.message === "string") detail = response.message;
        }
        throw new Error(detail);
      }
      onCreated();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not create the account."); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="team-add-dialog" aria-labelledby="team-add-title" onClose={onClose} onCancel={(event) => { if (busy) event.preventDefault(); }}><header><div><span>TEAM MANAGEMENT</span><h2 id="team-add-title">Add team member</h2></div><button type="button" disabled={busy} aria-label="Close" onClick={() => dialog.current?.close()}>×</button></header><form onSubmit={submit}><p>Create a login for a photographer or videographer. Confirm the email belongs to them, then share the initial password privately.</p><label>Full name<input name="fullName" {...nameInputProps} onInput={filterNameInput} autoComplete="name" required /></label><label>Email address<input name="email" {...emailInputProps} onInput={filterEmailInput} autoComplete="off" required /></label><div className="team-add-grid"><label>Role<select name="role" defaultValue="photographer"><option value="photographer">Photographer</option><option value="videographer">Videographer</option></select></label><label>Phone (optional)<input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="11 digits" /></label></div><label>Initial password<input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required /></label><label>Confirm password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required /></label><label className="team-add-toggle"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show passwords</label><p className="team-add-note">The account can log in immediately; email ownership is not verified by this form. Passwords are not displayed again after creation.</p>{error && <p className="team-add-error" role="alert">{error}</p>}<div className="team-add-actions"><button type="button" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button></div></form></dialog>;
}

export default function TeamDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Success messages are shown as toasts (see components/ToastProvider).
  useToastMessage(notice, setNotice, "success");
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    async function load() {
      const all: Member[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: loadError } = await supabase.from("profiles").select("id,full_name,phone,role").in("role", ["photographer", "videographer"]).order("full_name").order("id").range(offset, offset + 499);
        if (loadError) throw new Error(loadError.message);
        all.push(...data as Member[]);
        if (data.length < 500) return all;
      }
    }
    void load().then((data) => { if (active) { setMembers(data); setError(""); setLoading(false); } }).catch((failure: unknown) => { if (active) { setError(failure instanceof Error ? failure.message : "Could not load team members."); setLoading(false); } });
    return () => { active = false; };
  }, [revision]);
  // 10 members per page; a new search starts again at page 1.
  const filtered = members.filter((member) => `${member.full_name} ${member.phone ?? ""} ${member.role}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section className="team-directory"><header className="team-directory-header"><div><p>TEAM MANAGEMENT</p><h2>Team members</h2><div>Manage your photographers and videographers.</div></div><button type="button" className="team-directory-primary admin-action-button" onClick={() => { setNotice(""); setAddOpen(true); }}>+ Add team member</button></header>
    {error && <p className="team-directory-error" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Retry</button></p>}
    <div className="team-directory-panel"><div className="team-directory-toolbar"><div><span>YOUR TEAM</span><h3>All members <small>{loading || error ? "—" : members.length}</small></h3></div><label><span className="team-directory-sr-only">Search team members</span><input type="search" placeholder="Search name, role or phone..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label></div>{loading ? <p className="team-directory-empty" role="status">Loading team members...</p> : error ? <p className="team-directory-empty">Unable to load team members.</p> : !filtered.length ? <div className="team-directory-empty"><strong>{members.length ? "No matching members" : "Your team starts here"}</strong><p>{members.length ? "Try a different search." : "Add a photographer or videographer to get started."}</p></div> : <div className="team-directory-list">{pageSlice(filtered, clampPage(page, filtered.length)).map((member) => { const name = member.full_name || "Unnamed team member"; return <article key={member.id} className="team-directory-row"><div className="team-directory-person"><span aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")}</span><div><strong>{name}</strong><small>Team member</small></div></div><span className="team-directory-role">{member.role}</span><div className="team-directory-phone"><small>PHONE</small><span>{member.phone || "Not provided"}</span></div></article>; })}</div>}{!loading && !error && <Pagination className="admin-list-pagination" page={clampPage(page, filtered.length)} total={filtered.length} onChange={setPage} itemLabel="members" />}</div>
    {addOpen && <AddTeamMember onClose={() => setAddOpen(false)} onCreated={() => { setAddOpen(false); setNotice("Team account created. Share the email and initial password privately."); setLoading(true); setRevision((value) => value + 1); }} />}
  </section>;
}
