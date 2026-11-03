import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "../components/LiveRecords.css";
import "./PaymentProofs.css";

type Payment = { id: string; booking_id: string; amount: number; method: string; status: string; proof_path: string | null; created_at: string; bookings: { client_name: string; event_type: string; event_date: string; is_test: boolean; required_down_payment: number } | null };
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

function VerifyConfirmation({ amount, onCancel, onConfirm, busy, error }: { amount: number; onCancel: () => void; onConfirm: () => void; busy: boolean; error: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (ref.current && !ref.current.open) ref.current.showModal(); }, []);
  return <dialog ref={ref} className="payment-reject-dialog payment-verify-dialog" aria-labelledby="payment-verify-title" onClose={onCancel} onCancel={(event) => { if (busy) event.preventDefault(); }}>
    <div className="payment-verify-icon" aria-hidden="true">✓</div><p className="payment-reject-kicker">PAYMENT REVIEW</p><h2 id="payment-verify-title">Confirm received payment</h2>
    <p>Have you independently checked that this amount was received?</p><div className="payment-verify-amount"><span>AMOUNT RECEIVED</span><strong>{peso(amount)}</strong></div>
    <div className="payment-reject-note">The booking will be confirmed only when total verified payments meet the required down payment. If the total is short, the remaining balance will be shown to the client.</div>
    {error && <p className="payment-reject-error" role="alert">{error}</p>}
    <div className="payment-reject-actions"><button type="button" disabled={busy} onClick={() => ref.current?.close()}>Cancel</button><button type="button" disabled={busy} onClick={onConfirm}>{busy ? "Saving..." : "Confirm payment"}</button></div>
  </dialog>;
}

function RejectConfirmation({ onCancel, onConfirm, busy, error }: { onCancel: () => void; onConfirm: () => void; busy: boolean; error: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (ref.current && !ref.current.open) ref.current.showModal(); }, []);
  return <dialog ref={ref} className="payment-reject-dialog" aria-labelledby="payment-reject-title" onClose={onCancel} onCancel={(event) => { if (busy) event.preventDefault(); }}>
    <div className="payment-reject-icon" aria-hidden="true">!</div><p className="payment-reject-kicker">PAYMENT REVIEW</p><h2 id="payment-reject-title">Reject this proof?</h2>
    <p>The client will be asked to submit another proof. The amount typed in the review box will <strong>not</strong> be recorded as received.</p>
    <div className="payment-reject-note">If you actually received a partial payment, cancel and use <strong>Verify received amount</strong> instead.</div>
    {error && <p className="payment-reject-error" role="alert">{error}</p>}
    <div className="payment-reject-actions"><button type="button" disabled={busy} onClick={() => ref.current?.close()}>Cancel</button><button type="button" disabled={busy} onClick={onConfirm}>{busy ? "Rejecting..." : "Reject proof"}</button></div>
  </dialog>;
}

function ProofModal({ payment, url, onClose, onDownload, downloading, error, onVerify, onReview, verifying }: { payment: Payment; url: string; onClose: () => void; onDownload: () => void; downloading: boolean; error: string; onVerify: () => void; onReview: (action: "verify" | "reject", amount?: number) => void; verifying: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageError, setImageError] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const isPdf = /\.pdf$/i.test(payment.proof_path ?? "");
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(payment.proof_path ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return <dialog ref={dialogRef} className="payment-proof-dialog" aria-labelledby="payment-proof-title" onClose={onClose} onCancel={(event) => { if (verifying) event.preventDefault(); }} onClick={(event) => { if (!verifying && event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="payment-proof-header"><div><p>PAYMENT REVIEW</p><h2 id="payment-proof-title">Payment proof</h2><span>{payment.bookings?.client_name ?? "Client"} · {payment.method}{payment.bookings?.is_test ? " · TEST" : ""}</span></div><button type="button" aria-label="Close payment proof" disabled={verifying} onClick={() => dialogRef.current?.close()}>×</button></div>
    <div className="payment-proof-content">
      <div className="payment-proof-info"><div><span>{payment.status === "For Verification" ? "Expected amount (not verified)" : "Recorded amount"}</span><strong>{peso(Number(payment.amount))}</strong></div><div><span>Required down payment</span><strong>{payment.bookings ? peso(Number(payment.bookings.required_down_payment)) : "—"}</strong></div><div><span>Status</span><strong>{payment.status}</strong></div><div><span>Event</span><strong>{payment.bookings ? `${payment.bookings.event_type} · ${payment.bookings.event_date}` : "—"}</strong></div></div>
      <div className="payment-proof-preview">{isPdf ? <iframe title="Payment proof PDF" src={url} sandbox="" /> : isImage && !imageError ? <img src={url} alt="Submitted payment proof" onError={() => setImageError(true)} /> : <p>Preview unavailable. Download the proof to view it.</p>}</div>
      {!payment.bookings?.is_test && payment.status === "For Verification" && <div className="payment-review-fields"><label>Actual amount received (₱)<input type="number" min="0.01" max="9999999999.99" step="0.01" value={receivedAmount} onChange={(event) => setReceivedAmount(event.target.value)} placeholder="Enter amount verified in your account" /></label><p>Check the actual funds and receipt independently. The expected amount is not proof of payment. If the received amount is short, the client can submit another payment.</p></div>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="payment-proof-footer"><button type="button" disabled={verifying} onClick={() => dialogRef.current?.close()}>Close</button><button type="button" disabled={downloading || verifying} onClick={onDownload}>{downloading ? "Downloading..." : "Download proof"}</button>{payment.bookings?.is_test && payment.status === "For Verification" && <button type="button" disabled={downloading || verifying} onClick={onVerify}>{verifying ? "Verifying..." : "Verify test payment"}</button>}{payment.bookings && !payment.bookings.is_test && payment.status === "For Verification" && <><button type="button" disabled={downloading || verifying} onClick={() => setRejectOpen(true)}>Reject proof</button><button type="button" disabled={downloading || verifying || !receivedAmount || !Number.isFinite(Number(receivedAmount)) || Number(receivedAmount) <= 0} onClick={() => setVerifyOpen(true)}>{verifying ? "Saving..." : "Verify received amount"}</button></>}</div>
    {rejectOpen && <RejectConfirmation busy={verifying} error={error} onCancel={() => setRejectOpen(false)} onConfirm={() => onReview("reject")} />}
    {verifyOpen && <VerifyConfirmation amount={Number(receivedAmount)} busy={verifying} error={error} onCancel={() => setVerifyOpen(false)} onConfirm={() => onReview("verify", Number(receivedAmount))} />}
  </dialog>;
}

export default function PaymentProofs() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [opening, setOpening] = useState("");
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    let active = true;
    async function load() {
      const records: Payment[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: loadError } = await supabase.from("payments").select("id,booking_id,amount,method,status,proof_path,created_at,bookings(client_name,event_type,event_date,is_test,required_down_payment)").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
        if (loadError) throw loadError;
        records.push(...(data as unknown as Payment[]));
        if (data.length < 500) break;
      }
      return records;
    }
    void load().then((data) => { if (active) { setPayments(data); setError(""); setLoading(false); } }).catch((failure: unknown) => { if (active) { setError(failure instanceof Error ? failure.message : "Could not load payments."); setLoading(false); } });
    return () => { active = false; };
  }, [retry]);

  async function openProof(payment: Payment) {
    if (!payment.proof_path || opening) return;
    setOpening(payment.id); setError("");
    try {
      const { data, error: downloadError } = await supabase.storage.from("payment-proofs").download(payment.proof_path);
      if (downloadError) throw downloadError;
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = payment.proof_path.split("/").pop() || "payment-proof";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not download payment proof."); }
    finally { setOpening(""); }
  }

  async function previewProof(payment: Payment) {
    if (!payment.proof_path || opening) return;
    setOpening(payment.id); setError("");
    try {
      const { data, error: signError } = await supabase.storage.from("payment-proofs").createSignedUrl(payment.proof_path, 300);
      if (signError) throw signError;
      setPreview({ id: payment.id, url: data.signedUrl });
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not preview payment proof."); }
    finally { setOpening(""); }
  }

  async function verifyTestPayment(payment: Payment) {
    if (verifying || !payment.bookings?.is_test || payment.status !== "For Verification") return;
    if (!window.confirm("Simulate verification of this TEST payment? This confirms only the test booking and does not record real payment.")) return;
    setVerifying(true); setError(""); setNotice("");
    try {
      const { error: verifyError } = await supabase.rpc("verify_test_payment", { p_payment_id: payment.id });
      if (verifyError) {
        setError(`Verification failed: ${verifyError.message}${verifyError.code ? ` (${verifyError.code})` : ""}`);
        return;
      }
      setPayments((current) => current.map((item) => item.id === payment.id ? { ...item, status: "Verified" } : item));
      setPreview(null);
      setNotice("TEST payment verified and client notified. No real payment or reservation was created.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not verify the test payment."); }
    finally { setVerifying(false); }
  }

  async function reviewPayment(payment: Payment, action: "verify" | "reject", amount?: number) {
    if (verifying || !payment.bookings || payment.bookings.is_test || payment.status !== "For Verification") return;
    setVerifying(true); setError(""); setNotice("");
    try {
      const { error: reviewError } = await supabase.rpc("review_booking_payment", { p_payment_id: payment.id, p_action: action, p_received_amount: amount ?? null });
      if (reviewError) { setError(`Review failed: ${reviewError.message}`); return; }
      setPreview(null);
      setNotice(action === "verify" ? "Payment reviewed. The client has been notified; the booking status reflects the total verified amount." : "Proof rejected. The client has been notified and can submit another proof.");
      setLoading(true); setRetry((value) => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not review payment."); }
    finally { setVerifying(false); }
  }

  const visiblePayments = filter === "All" ? payments : payments.filter((payment) => payment.status === filter);
  return <section className="live-records payments-page"><header className="payments-header"><div><p>ADMIN WORKSPACE / PAYMENTS</p><h2>Payments<span>.</span></h2><span>Review payment proofs and keep track of your bookings.</span></div>{!loading && !error && <div className="payments-review-count"><strong>{payments.filter((payment) => payment.status === "For Verification").length}</strong><span>awaiting review</span></div>}</header>
    {notice && <div className="live-records-note" role="status">{notice}</div>}
    {error && <div role="alert">{error} <button type="button" onClick={() => { setLoading(true); setError(""); setRetry((value) => value + 1); }}>Retry</button></div>}
    <div className="payments-panel"><div className="payments-toolbar"><div><span>PAYMENT RECORDS</span><h3>All transactions</h3></div><div className="payments-filters">{["All", "For Verification", "Verified", "Rejected"].map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}>{option === "For Verification" ? "For review" : option}</button>)}</div></div>
    {loading ? <p className="payments-empty" role="status">Loading payments...</p> : error ? <p className="payments-empty">Payment records could not be loaded.</p> : !visiblePayments.length ? <div className="payments-empty"><strong>{payments.length ? "No matching payments" : "No payments yet"}</strong><p>{payments.length ? "There are no payments in this category." : "Submitted payment proofs will appear here."}</p></div> : <div className="payments-table-wrap"><table className="payments-table"><thead><tr><th>Client / event</th><th>Amount</th><th>Method</th><th>Status</th><th>Payment proof</th></tr></thead><tbody>{visiblePayments.map((payment) => <tr key={payment.id}><td><strong>{payment.bookings?.client_name ?? "Client unavailable"}</strong><small>{payment.bookings ? `${payment.bookings.event_type} · ${payment.bookings.event_date}` : payment.booking_id}</small>{payment.bookings?.is_test && <small className="payments-test">TEST · simulated</small>}</td><td><strong>{peso(Number(payment.amount))}</strong><small>{payment.status === "Verified" ? payment.bookings?.is_test ? "Simulated amount" : "Verified amount" : "Expected amount"}</small></td><td>{payment.method}</td><td><span className={`payments-status ${payment.status === "Verified" ? "verified" : payment.status === "Rejected" ? "rejected" : "pending"}`}>{payment.status}</span></td><td>{payment.proof_path ? <button className="payment-proof-view-button" type="button" disabled={!!opening} onClick={() => void previewProof(payment)}>{opening === payment.id ? "Loading..." : "View proof →"}</button> : <span className="payments-no-proof">No proof</span>}</td></tr>)}</tbody></table></div>}
    </div>
    {preview && payments.find((payment) => payment.id === preview.id) && <ProofModal payment={payments.find((payment) => payment.id === preview.id)!} url={preview.url} onClose={() => { if (!verifying) setPreview(null); }} onDownload={() => { const payment = payments.find((item) => item.id === preview.id); if (payment) void openProof(payment); }} downloading={!!opening} error={error} onVerify={() => { const payment = payments.find((item) => item.id === preview.id); if (payment) void verifyTestPayment(payment); }} onReview={(action, amount) => { const payment = payments.find((item) => item.id === preview.id); if (payment) void reviewPayment(payment, action, amount); }} verifying={verifying} />}
  </section>;
}
