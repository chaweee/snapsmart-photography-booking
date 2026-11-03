import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "../gallery.css";

type Photo = { id: string; title: string; image_url: string };
async function preparePortfolioImage(file: File): Promise<File> {
  const image = await createImageBitmap(file);
  try {
    const maxPixels = 24_000_000;
    if (file.size <= 10 * 1024 * 1024 && image.width * image.height <= maxPixels) return file;
    let scale = Math.min(1, Math.sqrt(maxPixels / (image.width * image.height)));
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(image.width * scale));
      canvas.height = Math.max(1, Math.floor(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the photo for upload.");
      context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
      if (blob && blob.size <= 10 * 1024 * 1024) return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
      scale *= 0.8;
    }
    throw new Error("Could not compress this photo below 10 MB. Please resize it and try again.");
  } finally { image.close(); }
}
export default function PortfolioManager() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  useEffect(() => {
    let active = true;
    void supabase.from("portfolio_photos").select("id,title,image_url").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(`Could not load portfolio: ${error.message}`); else setPhotos(data ?? []);
    });
    return () => { active = false; };
  }, [revision]);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !files.length) return;
    if (files.length > 5 || files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 25 * 1024 * 1024 || !file.size)) { setMessage("Choose up to 5 JPEG, PNG or WebP photos, each no larger than 25 MB."); return; }
    setBusy(true); setMessage("");
    let uploaded = 0;
    try {
      for (const file of files) {
        const prepared = await preparePortfolioImage(file);
        const form = new FormData(); form.set("file", prepared);
        const { error } = await supabase.functions.invoke("portfolio-upload", { body: form });
        if (error) {
          let detail = "Upload failed. Check the portfolio and Cloudinary Media Library before retrying.";
          if (error.context instanceof Response) {
            const body = await error.context.json().catch(() => null);
            if (typeof body?.message === "string") detail = body.message;
          }
          throw new Error(detail);
        }
        uploaded++;
      }
      setMessage(`${uploaded} photo(s) uploaded and published to the public portfolio.`);
      setFiles([]); setInputKey((value) => value + 1);
    } catch (failure) { setMessage(`${uploaded} photo(s) uploaded. ${failure instanceof Error ? failure.message : "Upload failed."}`); }
    finally { setRevision((value) => value + 1); setBusy(false); }
  }
  async function deletePhoto(photo: Photo) {
    if (busy || !window.confirm("Delete this photo from the public portfolio and Cloudinary? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("portfolio-delete", { body: { id: photo.id } });
      if (error) {
        let detail = "Could not delete photo. Check the portfolio before retrying.";
        if (error.context instanceof Response) {
          const body = await error.context.json().catch(() => null);
          if (typeof body?.message === "string") detail = body.message;
        }
        throw new Error(detail);
      }
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setMessage(typeof data?.message === "string" ? data.message : "Photo deleted.");
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "Could not delete photo."); }
    finally { setBusy(false); }
  }
  return <section className="private-gallery-page"><div className="admin-page-header"><div><p>SHOWCASE</p><h2>Public portfolio</h2><span>Photos here are visible to everyone, including visitors who are not logged in.</span></div></div>
    {message && <p className="private-gallery-message" role="status">{message}</p>}
    <form className="private-gallery-panel portfolio-upload-panel" onSubmit={upload}>
      <div className="portfolio-upload-heading"><span>YOUR SHOWCASE</span><h3>Add portfolio photos</h3><p>Only upload photos you have permission to publish. Private client galleries remain separate.</p></div>
      <label className="gallery-file-picker portfolio-file-picker"><input key={inputKey} type="file" multiple required disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /><span className="gallery-file-icon" aria-hidden="true">↑</span><span className="gallery-file-copy"><strong>{files.length ? `${files.length} ${files.length === 1 ? "photo" : "photos"} selected` : "Choose photos to upload"}</strong><small>{files.length ? files.map((file) => file.name).join(", ") : "Select up to 5 photos · JPEG, PNG or WebP"}</small></span><span className="gallery-file-browse" aria-hidden="true">Browse files</span></label>
      <div className="portfolio-upload-footer"><p>Up to 25 MB each. Large photos are compressed or resized for Cloudinary; keep the originals separately.</p><button type="submit" disabled={busy || !files.length}>{busy ? "Preparing and uploading..." : "Upload and publish →"}</button></div>
    </form>
    <div className="private-gallery-panel"><h3>Published photos</h3>{photos.length ? <div className="gallery-admin-photo-grid">{photos.map((photo) => <div className="gallery-admin-photo" key={photo.id}><img src={photo.image_url} alt="Portfolio photo" loading="lazy" /><button type="button" disabled={busy} onClick={() => void deletePhoto(photo)}>Delete photo</button></div>)}</div> : <p>No published photos yet.</p>}</div>
  </section>;
}
