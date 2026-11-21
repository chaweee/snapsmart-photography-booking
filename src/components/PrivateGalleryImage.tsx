import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

// Fetch with the current user's session and keep the preview URL in this browser only.
export default function PrivateGalleryImage({ path, alt, lazy = false, openable = false }: { path: string; alt: string; lazy?: boolean; openable?: boolean }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(!lazy);
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!lazy || visible) return;
    const element = imageRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [lazy, visible]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    let objectUrl = "";
    void supabase.storage.from("gallery-files").download(path).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) { setFailed(true); return; }
      objectUrl = URL.createObjectURL(data);
      setUrl(objectUrl);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, visible]);

  const image = <img ref={imageRef} src={url || undefined} alt={failed ? "Photo unavailable" : alt} aria-busy={!url && !failed} />;
  return openable && url ? <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${alt} in a new tab`}>{image}</a> : image;
}
