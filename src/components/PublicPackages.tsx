import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Package = { id: string; name: string; subtitle: string; price: number; required_down_payment: number; inclusions: string[] };
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(value);

export default function PublicPackages({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.resolve(supabase.from("packages").select("id,name,subtitle,price,required_down_payment,inclusions").eq("is_active", true).order("name"))
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError(true);
        else setPackages((data ?? []) as Package[]);
        setLoading(false);
      }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, []);
  if (loading) return <p role="status">Loading packages...</p>;
  if (error) return <p role="alert">Unable to load packages right now. Please try again later or contact the studio.</p>;
  if (!packages.length) return <p>No packages are currently available. Please contact the studio.</p>;
  return <><div className="public-package-grid">{packages.map((item) => <article className="public-package-card" key={item.id}>
    <header className="public-package-header"><div><span className="public-package-eyebrow">PHOTOGRAPHY PACKAGE</span><h3>{item.name}</h3><p className="public-package-subtitle">{item.subtitle}</p></div><strong className="public-package-price">{peso(Number(item.price))}</strong></header>
    <div className="public-package-body"><p className="public-package-inclusions-label">INCLUSIONS</p>
    <ul>{Array.isArray(item.inclusions) && item.inclusions.map((inclusion, inclusionIndex) => <li key={inclusionIndex}>{inclusion}</li>)}</ul>
    <p className="public-package-deposit">Down payment: <strong>{peso(Number(item.required_down_payment))}</strong></p></div>
  </article>)}</div><div className="public-package-action"><Link className="button button-dark" to={isLoggedIn ? "/book" : "/login"}>{isLoggedIn ? "Book a session" : "Log in to book"} <span aria-hidden="true">→</span></Link><p>Select your package on the booking page.</p></div></>;
}
