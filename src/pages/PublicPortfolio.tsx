import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import "./PortfolioPage.css";
type Photo = { id: string; title: string; image_url: string };
export default function PublicPortfolio() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.from("portfolio_photos").select("id,title,image_url").order("created_at", { ascending: false }).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError("Portfolio is temporarily unavailable. Please try again later."); else setPhotos(data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return <div className="portfolio-page public-portfolio"><Navbar /><main className="portfolio-main"><section className="portfolio-hero"><div className="portfolio-shell public-portfolio-hero"><p className="portfolio-eyebrow">TONI PHOTOGRAPHY · OUR PORTFOLIO</p><h1>Moments worth <span>remembering.</span></h1><p>A collection of stories, details, and moments captured by our team.</p><a href="#portfolio-collection">Explore our work ↓</a></div></section><section className="portfolio-content" id="portfolio-collection"><div className="portfolio-shell"><div className="portfolio-toolbar"><div><p className="portfolio-eyebrow">THE COLLECTION</p><h2>Through our lens.</h2></div><span className="public-portfolio-count">{loading ? "" : `${photos.length} ${photos.length === 1 ? "photograph" : "photographs"}`}</span></div>{loading ? <p>Loading photos...</p> : error ? <p role="alert">{error}</p> : !photos.length ? <p>Our portfolio photos are coming soon.</p> : <div className="public-portfolio-grid">{photos.map((photo, index) => <article className="public-portfolio-photo" key={photo.id}><img src={photo.image_url} alt={`Portfolio photo ${index + 1}`} loading="lazy" /></article>)}</div>}</div></section></main></div>;
}
