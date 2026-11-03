import { useEffect, useState, type FormEvent } from "react";
import { formatPeso } from "../data/packages";
import { supabase } from "../lib/supabase";
import "./Admin.css";

type CoverageType = "photo" | "photo_video" | "soft_copy";
interface AdminPackage {
  id: string;
  name: string;
  subtitle: string;
  coverage_type: CoverageType;
  price: number;
  required_down_payment: number;
  inclusions: string[];
  requires_photographer: boolean;
  requires_videographer: boolean;
  is_popular: boolean;
  is_active: boolean;
}

type PackageForm = Omit<AdminPackage, "price" | "required_down_payment" | "inclusions"> & {
  price: string;
  required_down_payment: string;
  inclusions: string;
};

const coverageLabels: Record<CoverageType, string> = {
  photo: "Photo",
  photo_video: "Photo + Video",
  soft_copy: "Soft Copies",
};

const emptyForm = (): PackageForm => ({
  id: "", name: "", subtitle: "", coverage_type: "photo", price: "",
  required_down_payment: "", inclusions: "", requires_photographer: true,
  requires_videographer: false, is_popular: false, is_active: true,
});

function AdminPackages() {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<PackageForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadPackages() {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase.from("packages").select("*").order("name");
    if (loadError) setError(`Could not load packages: ${loadError.message}`);
    else setPackages((data ?? []) as AdminPackage[]);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void supabase.from("packages").select("*").order("name").then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(`Could not load packages: ${loadError.message}`);
      else setPackages((data ?? []) as AdminPackage[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function openAdd() {
    setEditing(false);
    setFormError("");
    setForm(emptyForm());
  }

  function openEdit(item: AdminPackage) {
    setEditing(true);
    setFormError("");
    setForm({ ...item, price: String(item.price), required_down_payment: String(item.required_down_payment), inclusions: item.inclusions.join("\n") });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    const price = Number(form.price);
    const downPayment = Number(form.required_down_payment);
    if (!form.name.trim() || !form.subtitle.trim() || form.price.trim() === "" || form.required_down_payment.trim() === "" || !Number.isFinite(price) || !Number.isFinite(downPayment) || price < 0 || downPayment < 0 || downPayment > price) {
      setFormError("Enter a name, subtitle, valid price, and a down payment no greater than the price.");
      return;
    }
    const inclusions = form.inclusions.split("\n").map((item) => item.trim()).filter(Boolean);
    if (inclusions.length === 0) {
      setFormError("Add at least one inclusion.");
      return;
    }
    setSaving(true);
    setFormError("");
    const values = {
      name: form.name.trim(), subtitle: form.subtitle.trim(), coverage_type: form.coverage_type,
      price, required_down_payment: downPayment, inclusions,
      requires_photographer: form.requires_photographer, requires_videographer: form.requires_videographer,
      is_popular: form.is_popular, is_active: form.is_active,
    };
    const query = editing
      ? supabase.from("packages").update(values).eq("id", form.id)
      : supabase.from("packages").insert({ ...values, id: crypto.randomUUID() });
    const { data, error: saveError } = await query.select("id").single();
    setSaving(false);
    if (saveError || !data) {
      setFormError(`Could not save package: ${saveError?.message ?? "No package was saved."}`);
      return;
    }
    setForm(null);
    setNotice(editing ? "Package updated." : "Package added.");
    await loadPackages();
  }

  const prices = packages.map((item) => Number(item.price));

  return (
    <div className="admin-packages-page">
      <section className="admin-page-heading">
        <div><p>Manage Packages</p><h2>Photography packages</h2></div>
        <div className="dashboard-actions"><button type="button" onClick={openAdd}>Add Package</button></div>
      </section>

      {notice && <p role="status">{notice}</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => void loadPackages()}>Try again</button></div>}
      {loading ? <p>Loading packages...</p> : !error && <>
        <section className="package-summary-grid">
          <article className="overview-card"><span>Total Packages</span><strong>{packages.length}</strong><p>Package records</p></article>
          <article className="overview-card"><span>Active Packages</span><strong>{packages.filter((item) => item.is_active).length}</strong><p>Available for clients</p></article>
          <article className="overview-card"><span>Starting Price</span><strong>{prices.length ? formatPeso(Math.min(...prices)) : "—"}</strong><p>Lowest package price</p></article>
          <article className="overview-card"><span>Highest Package</span><strong>{prices.length ? formatPeso(Math.max(...prices)) : "—"}</strong><p>Highest package price</p></article>
        </section>

        {packages.length === 0 && <p>No packages found. Add your first package above.</p>}
        <section className="admin-package-grid">
          {packages.map((item) => <article className="admin-package-card" key={item.id}>
            <div className="admin-package-card-top"><div><span>{item.id}</span><h3>{item.name}</h3><p>{item.subtitle}</p></div><strong>{formatPeso(Number(item.price))}</strong></div>
            <div className="admin-package-meta"><span>{coverageLabels[item.coverage_type]}</span><span className="package-status-pill">{item.is_active ? "Active" : "Inactive"}</span></div>
            <div className="admin-package-inclusions"><h4>Inclusions</h4><ul>{item.inclusions.map((inclusion, index) => <li key={`${index}-${inclusion}`}>{inclusion}</li>)}</ul><p>Down payment: {formatPeso(Number(item.required_down_payment))}</p></div>
            <div className="admin-package-actions"><button type="button" onClick={() => openEdit(item)}>Edit Package</button></div>
          </article>)}
        </section>

        <section className="admin-panel package-table-panel">
          <div className="admin-panel-heading"><div><p>Package Records</p><h3>Package list</h3></div></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Package ID</th><th>Package Name</th><th>Coverage</th><th>Price</th><th>Status</th><th>No. of Inclusions</th></tr></thead><tbody>
            {packages.map((item) => <tr key={item.id}><td>{item.id}</td><td><strong>{item.name}</strong><br /><span>{item.subtitle}</span></td><td>{coverageLabels[item.coverage_type]}</td><td>{formatPeso(Number(item.price))}</td><td><span className="status-pill">{item.is_active ? "Active" : "Inactive"}</span></td><td>{item.inclusions.length}</td></tr>)}
          </tbody></table></div>
        </section>
      </>}

      {form && <div className="booking-action-modal-backdrop">
        <div className="booking-action-modal package-editor" role="dialog" aria-modal="true" aria-labelledby="package-editor-title">
          <div className="booking-action-modal-header package-editor-header"><div><p>SNAPSMART / PACKAGE MANAGEMENT</p><h2 id="package-editor-title">{editing ? "Edit package" : "Create a package"}</h2><span>{editing ? "Update your package details and offerings." : "Add a new offering for your clients."}</span></div><button className="booking-action-modal-close package-editor-close" type="button" aria-label="Close" disabled={saving} onClick={() => setForm(null)}>×</button></div>
          <form className="package-editor-form" onSubmit={handleSave}>
            <div className="package-editor-body">
              <section className="package-form-section">
                <div className="package-section-heading"><span>01</span><div><h3>Package details</h3><p>Give your offering a name and description.</p></div></div>
                <div className="package-form-grid">
                  <label>Package name<input autoFocus required maxLength={150} placeholder="e.g. Captured Moments" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                  <label>Subtitle<input required maxLength={200} placeholder="e.g. Photo Coverage Only" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></label>
                  <label className="package-field-full">Coverage type<select value={form.coverage_type} onChange={(e) => setForm({ ...form, coverage_type: e.target.value as CoverageType })}><option value="photo">Photo</option><option value="photo_video">Photo + Video</option><option value="soft_copy">Soft Copies</option></select></label>
                </div>
              </section>
              <section className="package-form-section">
                <div className="package-section-heading"><span>02</span><div><h3>Pricing & inclusions</h3><p>Set the price and what is included in this package.</p></div></div>
                <div className="package-form-grid">
                  <label>Package price <div className="package-money-input"><span aria-hidden="true">₱</span><input aria-label="Package price in pesos" type="number" min="0" step="0.01" required placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div></label>
                  <label>Required down payment <div className="package-money-input"><span aria-hidden="true">₱</span><input aria-label="Required down payment in pesos" type="number" min="0" step="0.01" required placeholder="0.00" value={form.required_down_payment} onChange={(e) => setForm({ ...form, required_down_payment: e.target.value })} /></div></label>
                  <label className="package-field-full">Package inclusions<textarea rows={5} required placeholder={"Coffee table album\nEvent coverage\nEdited photos"} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} /><small>Enter one inclusion per line.</small></label>
                </div>
              </section>
              <section className="package-form-section">
                <div className="package-section-heading"><span>03</span><div><h3>Package settings</h3><p>Choose the team and visibility for this package.</p></div></div>
                <div className="package-setting-grid">
                  <label className="package-check"><input type="checkbox" checked={form.requires_photographer} onChange={(e) => setForm({ ...form, requires_photographer: e.target.checked })} /><span><strong>Photographer</strong><small>Requires a photographer</small></span></label>
                  <label className="package-check"><input type="checkbox" checked={form.requires_videographer} onChange={(e) => setForm({ ...form, requires_videographer: e.target.checked })} /><span><strong>Videographer</strong><small>Requires a videographer</small></span></label>
                  <label className="package-check"><input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} /><span><strong>Popular package</strong><small>Highlight this offering</small></span></label>
                  <label className="package-check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><span><strong>Active</strong><small>Available for clients</small></span></label>
                </div>
              </section>
              {formError && <p className="package-form-error" role="alert">{formError}</p>}
            </div>
            <div className="booking-action-modal-footer package-editor-footer"><span>Your changes will be saved to the database.</span><div><button type="button" disabled={saving} onClick={() => setForm(null)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create package"}</button></div></div>
          </form>
        </div>
      </div>}
    </div>
  );
}

export default AdminPackages;
