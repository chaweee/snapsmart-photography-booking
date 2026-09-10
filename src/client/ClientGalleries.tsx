import { useState } from "react";
import "./Client.css";

const galleryAlbums = [
  {
    id: "GAL-2026-001",
    bookingId: "BK-2026-003",
    title: "Christening Gallery",
    eventDate: "Aug. 28, 2026",
    packageName: "Digital Keepsake Plus",
    status: "Available",
    photos: [
      "https://picsum.photos/seed/snapsmart-christening-1/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-2/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-3/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-4/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-5/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-6/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-7/1200/850",
      "https://picsum.photos/seed/snapsmart-christening-8/1200/850",
    ],
  },
  {
    id: "GAL-2026-002",
    bookingId: "BK-2026-001",
    title: "Wedding Gallery",
    eventDate: "Sept. 18, 2026",
    packageName: "Storyteller",
    status: "Available",
    photos: [
      "https://picsum.photos/seed/snapsmart-wedding-1/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-2/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-3/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-4/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-5/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-6/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-7/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-8/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-9/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-10/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-11/1200/850",
      "https://picsum.photos/seed/snapsmart-wedding-12/1200/850",
    ],
  },
];

function ClientGalleries() {
  const [activeAlbumId, setActiveAlbumId] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const activeAlbum = galleryAlbums.find((album) => album.id === activeAlbumId);
  const activePhoto = activeAlbum?.photos[activePhotoIndex];

  const openPhoto = (albumId: string, photoIndex: number) => {
    setActiveAlbumId(albumId);
    setActivePhotoIndex(photoIndex);
  };

  const closePhoto = () => {
    setActiveAlbumId("");
    setActivePhotoIndex(0);
  };

  const showPreviousPhoto = () => {
    if (!activeAlbum) return;

    setActivePhotoIndex((currentIndex) =>
      currentIndex === 0 ? activeAlbum.photos.length - 1 : currentIndex - 1,
    );
  };

  const showNextPhoto = () => {
    if (!activeAlbum) return;

    setActivePhotoIndex((currentIndex) =>
      currentIndex === activeAlbum.photos.length - 1 ? 0 : currentIndex + 1,
    );
  };

  return (
    <section className="client-page">
      <div className="client-page-heading">
        <div>
          <p>Client Portal</p>
          <h2>My Galleries</h2>
        </div>
      </div>

      <div className="clean-gallery-list">
        {galleryAlbums.map((album) => (
          <article key={album.id} className="clean-gallery-album">
            <div className="clean-gallery-header">
              <div>
                <span>{album.bookingId}</span>
                <h3>{album.title}</h3>
                <p>
                  {album.packageName} • {album.eventDate}
                </p>
              </div>

              <strong
                className={
                  album.status === "Available"
                    ? "client-gallery-status available"
                    : "client-gallery-status unavailable"
                }
              >
                {album.status}
              </strong>
            </div>

            {album.photos.length > 0 ? (
              <>
                <div className="clean-gallery-grid">
                  {album.photos.map((photo, index) => (
                    <button
                      type="button"
                      key={photo}
                      className="clean-gallery-photo"
                      onClick={() => openPhoto(album.id, index)}
                    >
                      <img src={photo} alt={`${album.title} ${index + 1}`} />
                    </button>
                  ))}
                </div>

                <div className="clean-gallery-actions">
                  <button type="button">Download Gallery</button>
                </div>
              </>
            ) : (
              <div className="client-empty-state">
                <strong>Gallery not available yet</strong>
                <p>
                  This gallery will appear here once the admin uploads the final
                  event photos.
                </p>
              </div>
            )}
          </article>
        ))}
      </div>

      {activeAlbum && activePhoto && (
        <div
          className="gallery-lightbox-backdrop"
          role="presentation"
          onClick={closePhoto}
        >
          <div
            className="gallery-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={closePhoto}
            >
              ×
            </button>

            <div className="gallery-lightbox-top">
              <div>
                <span>{activeAlbum.bookingId}</span>
                <h3>{activeAlbum.title}</h3>
              </div>

              <p>
                {activePhotoIndex + 1} / {activeAlbum.photos.length}
              </p>
            </div>

            <div className="gallery-lightbox-image-wrap">

              <img src={activePhoto} alt={activeAlbum.title} />

            </div>

            <div className="gallery-lightbox-bottom">
              <button type="button" onClick={showPreviousPhoto}>
                Previous
              </button>

              <button type="button" onClick={showNextPhoto}>
                Next
              </button>

              <a href={activePhoto} download>
                Download Photo
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ClientGalleries;