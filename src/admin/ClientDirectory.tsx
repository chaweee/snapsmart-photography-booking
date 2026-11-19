import { useState } from "react";
import "./ClientDirectory.css";
import Pagination from "../components/Pagination";
import { PAGE_SIZE, clampPage, pageSlice } from "../lib/pagination";

type Client = Record<string, unknown>;

export default function ClientDirectory({ records, loading, error, onRetry }: { records: Client[]; loading: boolean; error: string; onRetry: () => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = search.trim().toLocaleLowerCase();
  const filtered = records.filter((client) => [client.full_name, client.phone].some((value) => String(value ?? "").toLocaleLowerCase().includes(query)));
  // 10 clients per page; a new search starts again at page 1.
  const currentPage = clampPage(page, filtered.length);
  const date = (value: unknown) => {
    if (typeof value !== "string") return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  };

  return <section className="client-directory">
    <header className="client-directory-heading"><div><p>CLIENT RECORDS</p><h2>Client directory</h2><div>All your registered clients, in one place.</div></div><div className="client-directory-total"><span>REGISTERED CLIENTS</span><strong>{loading || error ? "—" : records.length.toLocaleString()}</strong><small>Client accounts</small></div></header>
    <section className="client-directory-panel" aria-labelledby="client-directory-title">
      <div className="client-directory-toolbar"><div><p>YOUR COMMUNITY</p><h3 id="client-directory-title">All clients <span>{!loading && !error ? records.length : "—"}</span></h3><small>Registered accounts only; walk-in clients without an account are not included.</small></div><label className="client-directory-search"><span className="client-directory-sr-only">Search clients by name or phone</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg><input type="search" placeholder="Search name or phone..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label></div>
      {loading ? <p className="client-directory-state" role="status">Loading clients...</p> : error ? <div className="client-directory-state" role="alert">Could not load clients: {error} <button type="button" onClick={onRetry}>Try again</button></div> : records.length === 0 ? <div className="client-directory-state"><strong>No clients yet</strong><p>Registered clients will appear here.</p></div> : filtered.length === 0 ? <div className="client-directory-state"><strong>No matching clients</strong><p>Try a different name or phone number.</p></div> : <><div className="client-directory-list-heading" aria-hidden="true"><span>CLIENT</span><span>PHONE NUMBER</span><span>DATE JOINED</span></div><div className="client-directory-list">{pageSlice(filtered, currentPage).map((client) => {
        const name = String(client.full_name || "Unnamed client");
        const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toLocaleUpperCase()).join("");
        return <article className="client-directory-row" key={String(client.id)}><div className="client-directory-person"><span className="client-directory-avatar" aria-hidden="true">{initials || "?"}</span><div><strong>{name}</strong><small>Registered client</small></div></div><div className="client-directory-cell"><small>PHONE NUMBER</small><span>{client.phone ? String(client.phone) : "Not provided"}</span></div><div className="client-directory-cell"><small>DATE JOINED</small><span>{date(client.created_at)}</span></div></article>;
      })}</div><footer>{filtered.length > PAGE_SIZE ? <Pagination className="client-directory-pagination" page={currentPage} total={filtered.length} onChange={setPage} itemLabel={query ? `matching clients (${records.length} total)` : "clients"} /> : <>Showing {filtered.length} of {records.length} {records.length === 1 ? "client" : "clients"}</>}</footer></>}
    </section>
  </section>;
}
