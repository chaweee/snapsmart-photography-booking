import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "../components/LiveRecords.css";

type Booking = { id: string; client_name: string; event_type: string; other_event_type: string | null; event_date: string; is_test: boolean; package_snapshot: { requires_videographer?: boolean } | null; packages: { requires_videographer: boolean } | null };
type Member = { id: string; full_name: string; role: "photographer" | "videographer" };
type Assignment = { booking_id: string; team_member_id: string; assignment_role: "photographer" | "videographer"; bookings: { client_name: string; event_type: string; other_event_type: string | null; event_date: string; is_test: boolean } };

async function assignmentsForDate(date: string): Promise<Assignment[]> {
  const all: Assignment[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("booking_assignments")
      .select("booking_id,team_member_id,assignment_role,bookings!inner(client_name,event_type,other_event_type,event_date,is_test,status)")
      .eq("bookings.event_date", date).neq("bookings.status", "Cancelled")
      .order("booking_id").order("team_member_id").order("assignment_role").range(offset, offset + 499);
    if (error) throw new Error(error.message);
    all.push(...(data as unknown as Assignment[]));
    if (data.length < 500) return all;
  }
}

export default function BookingTeamAssignments() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [scheduleRevision, setScheduleRevision] = useState(0);
  const booking = bookings.find((item) => item.id === bookingId);
  const needsVideographer = booking?.package_snapshot?.requires_videographer ?? booking?.packages?.requires_videographer;
  const eligibleMembers = members.filter((member) => member.role !== "videographer" || needsVideographer === true);
  const selectedDate = booking?.event_date ?? "";
  const scheduleReady = !!selectedDate && scheduleDate === selectedDate && !scheduleError;

  useEffect(() => {
    let active = true;
    async function load() {
      const allBookings: Booking[] = [];
      const allMembers: Member[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("bookings").select("id,client_name,event_type,other_event_type,event_date,is_test,package_snapshot,packages(requires_videographer)").eq("status", "Confirmed").order("event_date", { ascending: false }).order("id").range(offset, offset + 499);
        if (error) throw new Error(error.message);
        allBookings.push(...data as unknown as Booking[]);
        if (data.length < 500) break;
      }
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("profiles").select("id,full_name,role").in("role", ["photographer", "videographer"]).order("full_name").order("id").range(offset, offset + 499);
        if (error) throw new Error(error.message);
        allMembers.push(...data as Member[]);
        if (data.length < 500) break;
      }
      return { allBookings, allMembers };
    }
    void load().then(({ allBookings, allMembers }) => { if (active) { setBookings(allBookings); setMembers(allMembers); setError(""); setLoading(false); } }).catch((failure: unknown) => { if (active) { setError(failure instanceof Error ? failure.message : "Unable to load assignments."); setLoading(false); } });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    void assignmentsForDate(selectedDate).then((rows) => { if (active) { setAssignments(rows); setScheduleDate(selectedDate); setScheduleError(""); } }).catch((failure: unknown) => { if (active) { setScheduleDate(""); setScheduleError(failure instanceof Error ? failure.message : "Could not check assignments."); } });
    return () => { active = false; };
  }, [selectedDate, scheduleRevision]);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const member = members.find((item) => item.id === memberId);
    if (!booking || !member || busy || !scheduleReady) return;
    if (member.role === "videographer" && needsVideographer !== true) { setError("This booking's package does not specify a videographer."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const latest = await assignmentsForDate(booking.event_date);
      setAssignments(latest);
      if (latest.some((item) => item.booking_id === booking.id && item.team_member_id === member.id)) throw new Error("This team member is already assigned to this booking.");
      if (member.role === "photographer" && latest.some((item) => item.booking_id === booking.id && item.assignment_role === "photographer")) throw new Error("This booking already has a photographer. Remove the current photographer before assigning another.");
      const other = latest.filter((item) => item.team_member_id === member.id && item.booking_id !== booking.id);
      if (other.length && !window.confirm(`${member.full_name} already has ${other.length} other assignment(s) on ${booking.event_date}. Continue anyway?`)) return;
      const { error: saveError } = await supabase.from("booking_assignments").insert({ booking_id: booking.id, team_member_id: member.id, assignment_role: member.role });
      if (saveError) throw new Error(saveError.message);
      setMemberId(""); setNotice("Team member assigned. Their schedule will show this event.");
      setScheduleDate(""); setScheduleRevision((value) => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not assign team member."); }
    finally { setBusy(false); }
  }

  async function remove(assignment: Assignment) {
    if (busy || !window.confirm("Remove this team member from the booking? They will lose access to this event.")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: deleteError } = await supabase.from("booking_assignments").delete().eq("booking_id", assignment.booking_id).eq("team_member_id", assignment.team_member_id).eq("assignment_role", assignment.assignment_role).select("booking_id").single();
      if (deleteError || !data) throw new Error(deleteError?.message ?? "Assignment was not removed.");
      setNotice("Team member removed from the booking."); setScheduleDate(""); setScheduleRevision((value) => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not remove assignment."); }
    finally { setBusy(false); }
  }

  const currentAssignments = assignments.filter((item) => item.booking_id === bookingId);
  return <section className="live-records assignments-panel"><header><p>TEAM SCHEDULING</p><h2>Assign team</h2><span>Select a confirmed booking and check the team's assignments for that date.</span></header>
    {error && <p role="alert">{error} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Reload</button></p>}{notice && <p role="status">{notice}</p>}
    {loading ? <p>Loading team assignments...</p> : <><form className="assignments-form" onSubmit={assign}><label>Confirmed booking<select required disabled={busy} value={bookingId} onChange={(event) => { setBookingId(event.target.value); setMemberId(""); setScheduleDate(""); setScheduleError(""); setScheduleRevision((value) => value + 1); }}><option value="">Select booking</option>{bookings.map((item) => <option key={item.id} value={item.id}>{item.is_test ? "[TEST] " : ""}{item.client_name} · {item.other_event_type || item.event_type} · {item.event_date} · {item.id.slice(0, 8)}</option>)}</select></label><label>Team member<select required disabled={busy || !scheduleReady} value={memberId} onChange={(event) => setMemberId(event.target.value)}><option value="">{!selectedDate ? "Choose a booking first" : !scheduleReady ? "Checking assignments..." : "Select photographer or videographer"}</option>{scheduleReady && eligibleMembers.map((member) => { const assigned = assignments.filter((item) => item.team_member_id === member.id); const onThisBooking = assigned.some((item) => item.booking_id === bookingId); const photographerTaken = member.role === "photographer" && assignments.some((item) => item.booking_id === bookingId && item.assignment_role === "photographer"); const others = assigned.filter((item) => item.booking_id !== bookingId).length; return <option key={member.id} value={member.id} disabled={onThisBooking || photographerTaken}>{member.full_name || member.id} · {member.role} · {onThisBooking ? "Already assigned here" : photographerTaken ? "Photographer already assigned" : others ? `${others} other event(s) on this date` : "No assigned events on this date"}</option>; })}</select></label><button type="submit" disabled={busy || !bookingId || !memberId || !scheduleReady}>Assign member</button></form>
      {booking && needsVideographer == null && <p className="assignment-package-note">Videographer requirement is unavailable for this booking; check its package settings.</p>}
      {selectedDate && <div className="assignment-availability"><strong>Schedule for {selectedDate}</strong>{scheduleError ? <p role="alert">Could not check assignments: {scheduleError} <button type="button" onClick={() => setScheduleRevision((value) => value + 1)}>Retry</button></p> : !scheduleReady ? <p>Checking team assignments...</p> : <><p>Based on saved event assignments only; personal availability and leave are not tracked. Confirm availability with the team member.</p><div className="assignment-availability-grid">{eligibleMembers.length ? eligibleMembers.map((member) => { const events = assignments.filter((item) => item.team_member_id === member.id); return <div key={member.id}><strong>{member.full_name || member.id}</strong><span>{member.role}</span><small className={events.length ? "assigned" : "clear"}>{events.length ? `${events.length} assigned event(s)` : "No assigned events"}</small>{events.map((item) => <p key={`${item.booking_id}-${item.assignment_role}`}>{item.bookings.is_test ? "TEST · " : ""}{item.bookings.other_event_type || item.bookings.event_type} · {item.bookings.client_name}{item.booking_id === bookingId ? " (this booking)" : ""}</p>)}</div>; }) : <p>No eligible team members found.</p>}</div></>}</div>}
      <div className="assignments-list"><h3>Assignments for selected booking</h3>{!bookingId ? <p>Select a booking to view assignments.</p> : !scheduleReady ? <p>Assignments unavailable until the schedule is loaded.</p> : currentAssignments.length === 0 ? <p>No team members assigned yet.</p> : currentAssignments.map((item) => <div key={`${item.booking_id}-${item.team_member_id}-${item.assignment_role}`}><span>{members.find((member) => member.id === item.team_member_id)?.full_name || item.team_member_id} · {item.assignment_role}</span><button type="button" disabled={busy} onClick={() => void remove(item)}>Remove</button></div>)}</div>
    </>}
  </section>;
}
