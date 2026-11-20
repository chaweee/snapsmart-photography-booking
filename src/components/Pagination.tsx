import { PAGE_SIZE, clampPage, pageCount } from "../lib/pagination";
import "./Pagination.css";

type Props = {
  page: number;
  total: number;
  onChange: (page: number) => void;
  /** What is being paged, for the "Showing 1–10 of 48 bookings" text. */
  itemLabel?: string;
  pageSize?: number;
  className?: string;
};

/** Previous / Next buttons. Renders nothing when everything fits on one page. */
export default function Pagination({ page, total, onChange, itemLabel = "items", pageSize = PAGE_SIZE, className }: Props) {
  const pages = pageCount(total, pageSize);
  if (total <= pageSize) return null;
  const current = clampPage(page, total, pageSize);
  const first = (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);

  return (
    <nav className={`pagination${className ? ` ${className}` : ""}`} aria-label={`${itemLabel} pages`}>
      <p className="pagination-summary">Showing {first}–{last} of {total} {itemLabel}</p>
      <div className="pagination-controls">
        <button type="button" disabled={current === 1} onClick={() => onChange(current - 1)} aria-label={`Previous page (page ${current - 1} of ${pages})`}>← Prev</button>
        <button type="button" disabled={current === pages} onClick={() => onChange(current + 1)} aria-label={`Next page (page ${current + 1} of ${pages})`}>Next →</button>
      </div>
    </nav>
  );
}
