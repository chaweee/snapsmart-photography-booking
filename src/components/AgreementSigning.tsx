import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabase";
import "./AgreementSigning.css";

type Material = { version: string; terms: string; booking_snapshot: Record<string, unknown>; consent_text: string };
type Request = { path: string; signature: Blob; adminBase64: string; material: Material; uploaded: boolean };
const dataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image.")); reader.onerror = () => reject(new Error("Could not read image.")); reader.readAsDataURL(blob); });
function displayValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key.replace(/_/g, " ")}: ${displayValue(item)}`).join("\n");
  return String(value);
}

export default function AgreementSigning({ bookingId, onSigned }: { bookingId: string; onSigned: () => void }) {
  const { session } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const request = useRef<Request | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.rpc("agreement_signing_material", { p_booking_id: bookingId }).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message); else setMaterial(data as Material);
      setLoading(false);
    });
    return () => { active = false; };
  }, [bookingId]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * event.currentTarget.width / rect.width, y: (event.clientY - rect.top) * event.currentTarget.height / rect.height };
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || locked) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); drawing.current = true;
  }
  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || busy || locked) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const p = point(event); context.lineWidth = 3; context.lineCap = "round"; context.strokeStyle = "#29221e"; context.lineTo(p.x, p.y); context.stroke(); setHasSignature(true);
  }
  async function sign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !material || busy) return;
    if (!request.current && !hasSignature) { setError("Please draw your signature before signing."); return; }
    setBusy(true); setError("");
    try {
      if (!request.current) {
        const signature = await new Promise<Blob>((resolve, reject) => {
          if (!canvas.current) { reject(new Error("Signature pad unavailable.")); return; }
          canvas.current.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not capture signature.")), "image/png");
        });
        if (signature.size > 1048576) throw new Error("Signature image is too large.");
        const adminResponse = await fetch(`${import.meta.env.BASE_URL}ESIGN.png`);
        if (!adminResponse.ok) throw new Error("Could not load the admin signature.");
        const adminBase64 = (await dataUrl(await adminResponse.blob())).split(",")[1];
        if (!adminBase64) throw new Error("Invalid admin signature image.");
        request.current = { path: `signature/${session.user.id}/${bookingId}/${crypto.randomUUID()}.png`, signature, adminBase64, material, uploaded: false };
        setLocked(true);
      }
      const item = request.current;
      if (!item.path.startsWith(`signature/${session.user.id}/${bookingId}/`)) throw new Error("Account changed. Close and reopen the agreement.");
      if (!item.uploaded) {
        const { error: uploadError } = await supabase.storage.from("agreement-files").upload(item.path, item.signature, { contentType: "image/png", upsert: false });
        if (uploadError) {
          const { data: exists, error: existsError } = await supabase.storage.from("agreement-files").exists(item.path);
          if (existsError || !exists) throw new Error(uploadError.message);
        }
        item.uploaded = true;
      }
      const { data, error: signError } = await supabase.rpc("sign_booking_agreement", { p_booking_id: bookingId, p_version: item.material.version, p_terms: item.material.terms, p_snapshot: item.material.booking_snapshot, p_signature_path: item.path, p_admin_png_base64: item.adminBase64, p_consent: true });
      if (signError) throw new Error(signError.message);
      if (!data) throw new Error("The agreement was not confirmed saved.");
      onSigned();
    } catch (failure) { setError(`${failure instanceof Error ? failure.message : "Could not sign agreement."} If details changed, close and reopen to review them again.`); }
    finally { setBusy(false); }
  }

  if (loading) return <p>Loading agreement details...</p>;
  if (!material) return <p role="alert">{error || "Agreement is unavailable."}</p>;
  return <form className="agreement-signing" onSubmit={sign}>
    <p className="agreement-signing-note">Review the booking details and terms before signing. Your signature and agreement will be saved to this booking.</p>
    <h3>Booking details</h3><dl className="booking-agreement-snapshot-details">{Object.entries(material.booking_snapshot).map(([key, value]) => <div key={key}><dt>{key.replace(/_/g, " ")}</dt><dd>{displayValue(value)}</dd></div>)}</dl>
    <h3>Terms and conditions</h3><div className="booking-agreement-snapshot">{material.terms}</div>
    <div className="agreement-signing-grid"><div><span>CLIENT SIGNATURE</span><canvas ref={canvas} width={820} height={220} aria-label="Draw your signature" onPointerDown={start} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} /><button type="button" disabled={busy || locked} onClick={() => { const pad = canvas.current; if (pad) pad.getContext("2d")?.clearRect(0, 0, pad.width, pad.height); setHasSignature(false); }}>Clear signature</button><strong>{String(material.booking_snapshot.client_name ?? "Client")}</strong></div><div><span>TONI PHOTOGRAPHY</span><div className="agreement-owner-signature"><img src={`${import.meta.env.BASE_URL}ESIGN.png`} alt="Toni Photography signature" /></div><strong>Toni Photography</strong></div></div>
    <label className="agreement-signing-consent"><input type="checkbox" required disabled={busy || locked} defaultChecked={false} />{material.consent_text}</label>
    {error && <p className="agreement-signing-error" role="alert">{error}</p>}
    <button className="booking-view-primary" type="submit" disabled={busy}>{busy ? "Saving agreement..." : locked ? "Retry signing" : "Sign agreement"}</button>
  </form>;
}
