import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Client.css";
import "../gallery.css";

type Gallery = { id: string; title: string; booking_id: string };
type Photo = { id: string; gallery_id: string; file_path: string; url: string };

export default function PrivateGalleries() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");
  const [zipProgress, setZipProgress] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewer, setViewer] = useState<{ galleryId: string; photoId: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (viewer && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [viewer]);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: galleryData, error: galleryError } = await supabase.from("galleries").select("id, title, booking_id").eq("is_available", true).order("created_at", { ascending: false });
      if (galleryError) throw galleryError;
      if (!galleryData.length) return { galleryData, photos: [] as Photo[] };
      const { data: itemData, error: itemError } = await supabase.from("gallery_items").select("id, gallery_id, file_path").in("gallery_id", galleryData.map((gallery) => gallery.id)).order("created_at");
      if (itemError) throw itemError;
      const signedPhotos = await Promise.all(itemData.map(async (item) => {
        const { data, error: signError } = await supabase.storage.from("gallery-files").createSignedUrl(item.file_path, 3600);
        if (signError) throw signError;
        return { ...item, url: data.signedUrl };
      }));
      return { galleryData, photos: signedPhotos };
    }
    void load().then((result) => {
      if (!active) return;
      setGalleries(result.galleryData); setPhotos(result.photos); setError(""); setLoading(false);
    }).catch((loadError: unknown) => {
      if (!active) return;
      setError(`Could not load galleries: ${loadError instanceof Error ? loadError.message : "Please try again."}`); setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  async function download(photo: Photo) {
    setDownloading(photo.id); setError("");
    try {
      const { data, error: downloadError } = await supabase.storage.from("gallery-files").download(photo.file_path);
      if (downloadError) throw downloadError;
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url; link.download = photo.file_path.split("/").pop() ?? "photo";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) { setError(`Could not download photo: ${downloadError instanceof Error ? downloadError.message : "Please try again."}`); }
    finally { setDownloading(""); }
  }

  async function downloadGallery(gallery: Gallery, galleryPhotos: Photo[]) {
    if (downloading || !galleryPhotos.length) return;
    setDownloading(`zip:${gallery.id}`); setError("");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const [index, photo] of galleryPhotos.entries()) {
        setZipProgress(`Preparing photo ${index + 1} of ${galleryPhotos.length}...`);
        const { data, error: downloadError } = await supabase.storage.from("gallery-files").download(photo.file_path);
        if (downloadError || !data) throw new Error(`Could not download photo ${index + 1}. No ZIP was saved; please try again.`);
        const extension = photo.file_path.split(".").pop()?.toLowerCase();
        const safeExtension = extension && /^[a-z0-9]{1,5}$/.test(extension) ? `.${extension}` : "";
        zip.file(`photo-${String(index + 1).padStart(3, "0")}${safeExtension}`, data);
      }
      setZipProgress("Creating ZIP...");
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = gallery.title.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "gallery";
      link.href = url; link.download = `${name}.zip`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not create the ZIP. Please try again."); }
    finally { setDownloading(""); setZipProgress(""); }
  }

  const currentGallery = galleries.find((gallery) => gallery.id === viewer?.galleryId);
  const viewerPhotos = photos.filter((photo) => photo.gallery_id === viewer?.galleryId);
  const currentIndex = viewerPhotos.findIndex((photo) => photo.id === viewer?.photoId);
  const currentPhoto = viewerPhotos[currentIndex];
  const move = (direction: number) => {
    if (!viewer || currentIndex < 0 || viewerPhotos.length < 2) return;
    setViewer({ ...viewer, photoId: viewerPhotos[(currentIndex + direction + viewerPhotos.length) % viewerPhotos.length].id });
  };

  return <section className="client-page private-gallery-page client-galleries-page">
    <div className="client-page-heading"><div><p>Client Portal</p><h2>My Galleries</h2><span>Preview your photos here and download the original file.</span></div></div>
    {error && <p className="private-gallery-message" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }}>Try again</button></p>}
    {loading ? <p>Loading your galleries...</p> : !error && galleries.length === 0 ? <div className="client-galleries-empty"><div className="client-galleries-empty-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><rect x="7" y="9" width="34" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="m10 34 9-9 6 6 5-5 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span>YOUR MEMORIES AWAIT</span><h3>No galleries available yet</h3><p>Your photos will appear here once Toni Photography releases your private gallery.</p><Link to="/client/bookings">View my bookings <span aria-hidden="true">→</span></Link></div> : galleries.map((gallery) => {
      const galleryPhotos = photos.filter((photo) => photo.gallery_id === gallery.id);
      return <article className="clean-gallery-album" key={gallery.id}><div className="clean-gallery-header"><div><span>Private client gallery</span><h3>{gallery.title}</h3><p>{galleryPhotos.length} photo(s)</p></div><div className="client-gallery-actions"><strong className="client-gallery-status available">Available</strong>{galleryPhotos.length > 0 && <button type="button" className="client-gallery-zip" disabled={!!downloading} onClick={() => void downloadGallery(gallery, galleryPhotos)}>{downloading === `zip:${gallery.id}` ? "Preparing ZIP..." : "↓ Download all (ZIP)"}</button>}</div></div>
        {downloading === `zip:${gallery.id}` && <p className="client-gallery-zip-progress" role="status">{zipProgress}</p>}
        <div className="client-gallery-masonry">{galleryPhotos.map((photo, index) => <button className="client-gallery-photo" type="button" key={photo.id} onClick={() => setViewer({ galleryId: gallery.id, photoId: photo.id })} aria-label={`Open ${gallery.title} photo ${index + 1}`}><img src={photo.url} alt="" loading="lazy" /></button>)}</div>
        {!galleryPhotos.length && <p>No photos available in this gallery yet.</p>}
      </article>;
    })}
    {viewer && currentPhoto && <dialog ref={dialog} className="client-photo-viewer" aria-label={`${currentGallery?.title || "Gallery"} photo viewer`} onClose={() => setViewer(null)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } }}>
      <div className="client-photo-viewer-top"><div><span>PRIVATE GALLERY</span><strong>{currentGallery?.title}</strong></div><div><small>{currentIndex + 1} / {viewerPhotos.length}</small><button type="button" className="client-photo-close" aria-label="Close photo viewer" onClick={() => dialog.current?.close()}>×</button></div></div>
      <div className="client-photo-stage"><button type="button" className="client-photo-arrow" aria-label="Previous photo" disabled={viewerPhotos.length < 2} onClick={() => move(-1)}>←</button><img src={currentPhoto.url} alt={`${currentGallery?.title || "Gallery"} photo ${currentIndex + 1}`} /><button type="button" className="client-photo-arrow" aria-label="Next photo" disabled={viewerPhotos.length < 2} onClick={() => move(1)}>→</button></div>
      <div className="client-photo-viewer-bottom">{error && <p role="alert">{error}</p>}<button type="button" className="client-photo-download" disabled={!!downloading} onClick={() => void download(currentPhoto)}>{downloading === currentPhoto.id ? "Downloading..." : "↓  Download original"}</button></div>
    </dialog>}
  </section>;
}
