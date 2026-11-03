import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import * as tus from "tus-js-client";
import "./Admin.css";
import "../gallery.css";

type Booking = { id: string; client_name: string; client_id: string | null; event_type: string; event_date: string };
type Gallery = { id: string; booking_id: string; title: string; is_available: boolean };
type GalleryItem = { id: string; file_path: string; url?: string };

async function uploadOriginal(path: string, file: File, onProgress: (percent: number) => void) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error("Please log in again before uploading.");
  const projectUrl = new URL(import.meta.env.VITE_SUPABASE_URL);
  const storageHost = projectUrl.hostname.endsWith(".supabase.co") ? projectUrl.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co") : projectUrl.host;
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${projectUrl.protocol}//${storageHost}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000],
      headers: { authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: "gallery-files", objectName: path, contentType: file.type, cacheControl: "3600" },
      chunkSize: 6 * 1024 * 1024,
      onProgress: (sent, total) => onProgress(Math.round(sent / total * 100)),
      onError: reject,
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}

async function loadPhotos(galleryId: string): Promise<GalleryItem[]> {
  const { data, error } = await supabase.from("gallery_items").select("id, file_path").eq("gallery_id", galleryId).order("created_at");
  if (error) throw new Error(error.message);
  return Promise.all((data ?? []).map(async (item) => {
    const { data: signed } = await supabase.storage.from("gallery-files").createSignedUrl(item.file_path, 3600);
    return { ...item, url: signed?.signedUrl };
  }));
}

export default function PrivateGalleries() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  async function refresh() {
    const [bookingResult, galleryResult] = await Promise.all([
      supabase.from("bookings").select("id, client_id, client_name, event_type, event_date").order("event_date", { ascending: false }),
      supabase.from("galleries").select("id, booking_id, title, is_available").order("created_at", { ascending: false }),
    ]);
    if (bookingResult.error || galleryResult.error) throw new Error(bookingResult.error?.message ?? galleryResult.error?.message);
    setBookings(bookingResult.data ?? []);
    setGalleries(galleryResult.data ?? []);
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("bookings").select("id, client_id, client_name, event_type, event_date").order("event_date", { ascending: false }),
      supabase.from("galleries").select("id, booking_id, title, is_available").order("created_at", { ascending: false }),
    ]).then(([b, g]) => {
      if (!active) return;
      if (b.error || g.error) setMessage(`Unable to load galleries: ${b.error?.message ?? g.error?.message}`);
      else { setBookings(b.data ?? []); setGalleries(g.data ?? []); }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selected) return;
    void loadPhotos(selected).then((data) => {
      if (!active) return;
      setItems(data);
      setItemsLoading(false);
    }).catch((error: unknown) => { if (active) { setMessage(`Unable to load photos: ${error instanceof Error ? error.message : "Please try again."}`); setItemsLoading(false); } });
    return () => { active = false; };
  }, [selected]);

  async function createGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !bookingId || !title.trim()) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.from("galleries").insert({ booking_id: bookingId, title: title.trim(), is_available: false }).select("id").single();
      if (error) throw error;
      setTitle(""); setBookingId(""); setItems([]); setItemsLoading(true); setSelected(data.id);
      await refresh();
      setMessage("Gallery created as a private draft. Upload photos before releasing it to the client.");
    } catch (error) { setMessage(`Could not create gallery: ${error instanceof Error ? error.message : "Please try again."}`); }
    finally { setBusy(false); }
  }

  async function uploadPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !selected || !files.length) return;
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) { setMessage("Use JPEG, PNG, or WebP photos only."); return; }
    if (files.some((file) => !file.size || file.size > 25 * 1024 * 1024)) { setMessage("Each photo must be between 1 byte and 25 MB."); return; }
    setBusy(true); setMessage("");
    let uploaded = 0;
    try {
      for (const file of files) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${selected}/${crypto.randomUUID()}.${extension}`;
        await uploadOriginal(path, file, (percent) => setUploadProgress(`Uploading ${uploaded + 1} of ${files.length}: ${percent}%`));
        const { error: rowError } = await supabase.from("gallery_items").insert({ gallery_id: selected, file_path: path });
        if (rowError) {
          throw new Error(`Could not confirm the photo record. Check this gallery before retrying; the storage file may require manual review (${path}).`);
        }
        uploaded++;
      }
      setMessage(`${uploaded} photo(s) uploaded.`);
    } catch (error) { setMessage(`${uploaded} photo(s) uploaded before an error: ${error instanceof Error ? error.message : "Please try again."}`); }
    finally {
      setFiles([]); setInputKey((value) => value + 1); setUploadProgress("");
      try { setItems(await loadPhotos(selected)); }
      catch (error) { setMessage(`Could not refresh photos: ${error instanceof Error ? error.message : "Please try again."}`); }
      setBusy(false);
    }
  }

  async function deletePhoto(item: GalleryItem) {
    if (busy || !selected || !window.confirm("Delete this photo from the gallery? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.from("gallery_items").delete().eq("id", item.id).eq("gallery_id", selected).select("id").maybeSingle();
      if (error || !data) throw new Error(error?.message ?? "Photo was not deleted.");
      setItems((current) => current.filter((photo) => photo.id !== item.id));
      const { data: references, error: referenceError } = await supabase.from("gallery_items").select("id").eq("file_path", item.file_path).limit(1);
      if (referenceError) throw new Error("Photo was removed from the gallery, but the storage file could not be checked. Contact an administrator.");
      if (!references.length) {
        const { error: storageError } = await supabase.storage.from("gallery-files").remove([item.file_path]);
        if (storageError) throw new Error(`Photo was removed from the gallery, but its storage file could not be deleted: ${storageError.message}`);
      }
      setMessage("Photo deleted from the gallery.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete photo."); }
    finally { setBusy(false); }
  }

  async function toggleRelease(gallery: Gallery) {
    if (busy) return;
    if (!gallery.is_available && !bookings.find((booking) => booking.id === gallery.booking_id)?.client_id) {
      setMessage("This booking has no linked client account. Link a client before releasing the gallery.");
      return;
    }
    if (!gallery.is_available && items.length === 0) { setMessage("Upload at least one photo before releasing the gallery."); return; }
    setBusy(true); setMessage("");
    const { data, error } = await supabase.from("galleries").update({ is_available: !gallery.is_available }).eq("id", gallery.id).select("id").single();
    if (error || !data) setMessage(`Could not update gallery: ${error?.message ?? "No gallery updated."}`);
    else {
      try { await refresh(); setMessage(gallery.is_available ? "Gallery is now hidden from the client." : "Gallery is now available to its client."); }
      catch (error) { setMessage(`Gallery updated, but refresh failed: ${error instanceof Error ? error.message : "Please reload."}`); }
    }
    setBusy(false);
  }

  const current = galleries.find((gallery) => gallery.id === selected);
  return <section className="admin-page private-gallery-page">
    <div className="admin-page-header"><div><p>Gallery Management</p><h2>Client galleries</h2><span>Private galleries are available only to their linked clients. Public portfolio publishing is not enabled here.</span></div></div>
    {message && <p className="private-gallery-message" role="status">{message}</p>}
    {loading ? <p>Loading galleries...</p> : <>
      <form className="private-gallery-panel" onSubmit={createGallery}>
        <h3>Create a gallery</h3>
        {bookings.length === 0 && <p>No real bookings are available yet. Create a booking before adding a gallery.</p>}
        <label>Booking<select value={bookingId} required onChange={(e) => setBookingId(e.target.value)}><option value="">Choose a booking</option>{bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.client_name} · {booking.event_type} · {booking.event_date}{booking.client_id ? "" : " (no client account)"}</option>)}</select></label>
        <label>Gallery title<input required maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding Gallery" /></label>
        <button type="submit" disabled={busy || !bookings.length}>Create draft</button>
      </form>
      {current ? <div className="private-gallery-panel gallery-folder-content"><button className="gallery-back" type="button" disabled={busy} onClick={() => { setSelected(""); setItems([]); setFiles([]); setInputKey((value) => value + 1); }}>← All galleries</button><div className="gallery-folder-heading"><div><span>GALLERY FOLDER</span><h3>{current.title}</h3><p>{bookings.find((booking) => booking.id === current.booking_id)?.client_name ?? "Booking"} · {itemsLoading ? "Loading photos..." : `${items.length} photo(s)`} · {current.is_available ? "Released to client" : "Private draft"}</p></div><button type="button" disabled={busy || itemsLoading} onClick={() => void toggleRelease(current)}>{current.is_available ? "Hide from client" : "Release to client"}</button></div><form className="gallery-upload" onSubmit={uploadPhotos}><label className="gallery-file-picker"><input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /><span className="gallery-file-icon" aria-hidden="true">↑</span><span className="gallery-file-copy"><strong>{files.length ? `${files.length} ${files.length === 1 ? "photo" : "photos"} selected` : "Choose photos to upload"}</strong><small>{files.length ? files.map((file) => file.name).join(", ") : "JPEG, PNG or WebP · Up to 25 MB per photo"}</small></span><span className="gallery-file-browse" aria-hidden="true">Browse files</span></label><button disabled={busy || itemsLoading || files.length === 0} type="submit">{busy ? "Working..." : "Upload photos"}</button></form><p>Original photos are stored privately in Supabase. Releasing shares them only with the linked client, not publicly.</p>{uploadProgress && <p role="status">{uploadProgress}</p>}{itemsLoading ? <p>Loading photos...</p> : items.length === 0 ? <div className="gallery-folder-empty">This folder is empty. Add photos above.</div> : <div className="gallery-admin-photo-grid">{items.map((item, index) => <div className="gallery-admin-photo" key={item.id}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={`${current.title} photo ${index + 1}`} loading="lazy" /></a> : <div className="gallery-photo-unavailable">Preview unavailable</div>}<button type="button" disabled={busy} onClick={() => void deletePhoto(item)}>Delete photo</button></div>)}</div>}</div> : <div className="gallery-folder-section"><div className="gallery-folder-section-heading"><h3>Gallery folders</h3><span>{galleries.length} folders</span></div>{!galleries.length ? <div className="gallery-folder-empty">No galleries yet. Create a draft above to get started.</div> : <div className="gallery-folder-grid">{galleries.map((gallery) => { const booking = bookings.find((item) => item.id === gallery.booking_id); return <button className="gallery-folder-card" type="button" disabled={busy} key={gallery.id} onClick={() => { setItems([]); setItemsLoading(true); setSelected(gallery.id); setFiles([]); setInputKey((value) => value + 1); }}><svg aria-hidden="true" viewBox="0 0 48 40" fill="none"><path d="M2 8a5 5 0 0 1 5-5h11l5 5h18a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V8Z" fill="currentColor"/><path d="M3 15h42" stroke="#fff" strokeOpacity=".4"/></svg><strong>{gallery.title}</strong><span>{booking ? `${booking.client_name} · ${booking.event_type} · ${booking.event_date}` : "Booking unavailable"}</span><small>{gallery.is_available ? "Released to client" : "Private draft"}</small></button>; })}</div>}</div>}
    </>}
  </section>;
}
