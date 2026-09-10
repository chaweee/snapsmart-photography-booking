import { useMemo, useState } from "react";
import "./Admin.css";

type GalleryStatus = "Draft" | "Private" | "Published";
type GalleryVisibility = "Client Only" | "Public Online Gallery";

interface AdminGallery {
  id: string;
  bookingId: string;
  clientName: string;
  title: string;
  eventType: string;
  eventDate: string;
  packageName: string;
  photoCount: number;
  status: GalleryStatus;
  visibility: GalleryVisibility;
  coverPhoto: string;
  photos: string[];
}

const adminGalleries: AdminGallery[] = [
  {
    id: "GAL-2026-001",
    bookingId: "BK-2026-003",
    clientName: "Reyes Family",
    title: "Christening Gallery",
    eventType: "Christening",
    eventDate: "Aug. 28, 2026",
    packageName: "Digital Keepsake Plus",
    photoCount: 8,
    status: "Published",
    visibility: "Public Online Gallery",
    coverPhoto: "https://picsum.photos/seed/admin-christening-cover/1000/720",
    photos: [
      "https://picsum.photos/seed/admin-christening-1/900/650",
      "https://picsum.photos/seed/admin-christening-2/900/650",
      "https://picsum.photos/seed/admin-christening-3/900/650",
      "https://picsum.photos/seed/admin-christening-4/900/650",
      "https://picsum.photos/seed/admin-christening-5/900/650",
      "https://picsum.photos/seed/admin-christening-6/900/650",
    ],
  },
  {
    id: "GAL-2026-002",
    bookingId: "BK-2026-001",
    clientName: "Maria Santos",
    title: "Wedding Gallery",
    eventType: "Wedding",
    eventDate: "Sept. 18, 2026",
    packageName: "Storyteller",
    photoCount: 12,
    status: "Private",
    visibility: "Client Only",
    coverPhoto: "https://picsum.photos/seed/admin-wedding-cover/1000/720",
    photos: [
      "https://picsum.photos/seed/admin-wedding-1/900/650",
      "https://picsum.photos/seed/admin-wedding-2/900/650",
      "https://picsum.photos/seed/admin-wedding-3/900/650",
      "https://picsum.photos/seed/admin-wedding-4/900/650",
      "https://picsum.photos/seed/admin-wedding-5/900/650",
      "https://picsum.photos/seed/admin-wedding-6/900/650",
    ],
  },
  {
    id: "GAL-2026-003",
    bookingId: "BK-2026-004",
    clientName: "Daniel Mendoza",
    title: "Debut Highlights",
    eventType: "Debut",
    eventDate: "Sept. 22, 2026",
    packageName: "Storyteller",
    photoCount: 0,
    status: "Draft",
    visibility: "Client Only",
    coverPhoto: "https://picsum.photos/seed/admin-debut-cover/1000/720",
    photos: [],
  },
];

const galleryFilters = ["All", "Draft", "Private", "Published"];

function AdminGalleries() {
  const [selectedGalleryId, setSelectedGalleryId] = useState(
    adminGalleries[0]?.id ?? "",
  );
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredGalleries = useMemo(() => {
    if (activeFilter === "All") return adminGalleries;

    return adminGalleries.filter((gallery) => gallery.status === activeFilter);
  }, [activeFilter]);

  const selectedGallery =
    adminGalleries.find((gallery) => gallery.id === selectedGalleryId) ??
    adminGalleries[0];

  const publishedCount = adminGalleries.filter(
    (gallery) => gallery.status === "Published",
  ).length;

  const privateCount = adminGalleries.filter(
    (gallery) => gallery.status === "Private",
  ).length;

  const draftCount = adminGalleries.filter(
    (gallery) => gallery.status === "Draft",
  ).length;

  const totalPhotos = adminGalleries.reduce(
    (total, gallery) => total + gallery.photoCount,
    0,
  );

  const getGalleryStatusClass = (status: GalleryStatus) => {
    if (status === "Published") return "published";
    if (status === "Private") return "private";
    return "draft";
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Gallery Management</p>
          <h2>Manage galleries</h2>
          <span>
            Upload event photos, manage client galleries, and choose which
            albums can appear in the public online gallery.
          </span>
        </div>

        <div className="dashboard-actions">
          <button type="button">Create Gallery</button>
          <button type="button">Upload Photos</button>
        </div>
      </div>

      <div className="admin-gallery-summary-grid">
        <article className="admin-gallery-summary-card">
          <span>Total Galleries</span>
          <strong>{adminGalleries.length}</strong>
          <p>event gallery records</p>
        </article>

        <article className="admin-gallery-summary-card">
          <span>Total Photos</span>
          <strong>{totalPhotos}</strong>
          <p>uploaded gallery photos</p>
        </article>

        <article className="admin-gallery-summary-card">
          <span>Published</span>
          <strong>{publishedCount}</strong>
          <p>visible in online gallery</p>
        </article>

        <article className="admin-gallery-summary-card">
          <span>Private / Draft</span>
          <strong>{privateCount + draftCount}</strong>
          <p>client-only or unfinished galleries</p>
        </article>
      </div>

      <div className="admin-gallery-filter-row">
        {galleryFilters.map((filter) => (
          <button
            type="button"
            key={filter}
            className={activeFilter === filter ? "active" : ""}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="admin-gallery-layout">
        <div className="admin-gallery-grid">
          {filteredGalleries.map((gallery) => (
            <button
              type="button"
              key={gallery.id}
              className={
                selectedGallery.id === gallery.id
                  ? "admin-gallery-card active"
                  : "admin-gallery-card"
              }
              onClick={() => setSelectedGalleryId(gallery.id)}
            >
              <div className="admin-gallery-cover">
                <img src={gallery.coverPhoto} alt={gallery.title} />

                <span
                  className={`admin-gallery-status ${getGalleryStatusClass(
                    gallery.status,
                  )}`}
                >
                  {gallery.status}
                </span>
              </div>

              <div className="admin-gallery-card-body">
                <span>{gallery.bookingId}</span>
                <h3>{gallery.title}</h3>
                <p>
                  {gallery.clientName} • {gallery.eventDate}
                </p>

                <div className="admin-gallery-meta-row">
                  <strong>{gallery.photoCount} photos</strong>
                  <small>{gallery.visibility}</small>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedGallery && (
          <aside className="admin-gallery-details">
            <div className="admin-gallery-detail-cover">
              <img src={selectedGallery.coverPhoto} alt={selectedGallery.title} />
            </div>

            <div className="admin-gallery-detail-header">
              <span>{selectedGallery.id}</span>
              <h3>{selectedGallery.title}</h3>
              <p>{selectedGallery.clientName}</p>
            </div>

            <div className="admin-gallery-detail-badges">
              <strong
                className={`admin-gallery-status ${getGalleryStatusClass(
                  selectedGallery.status,
                )}`}
              >
                {selectedGallery.status}
              </strong>

              <strong className="admin-gallery-visibility">
                {selectedGallery.visibility}
              </strong>
            </div>

            <div className="admin-gallery-info-grid">
              <div>
                <span>Booking ID</span>
                <strong>{selectedGallery.bookingId}</strong>
              </div>

              <div>
                <span>Event Type</span>
                <strong>{selectedGallery.eventType}</strong>
              </div>

              <div>
                <span>Event Date</span>
                <strong>{selectedGallery.eventDate}</strong>
              </div>

              <div>
                <span>Package</span>
                <strong>{selectedGallery.packageName}</strong>
              </div>

              <div>
                <span>Photo Count</span>
                <strong>{selectedGallery.photoCount}</strong>
              </div>

              <div>
                <span>Visibility</span>
                <strong>{selectedGallery.visibility}</strong>
              </div>
            </div>

            <div className="admin-gallery-preview-section">
              <span>Photo Preview</span>

              {selectedGallery.photos.length > 0 ? (
                <div className="admin-gallery-preview-grid">
                  {selectedGallery.photos.map((photo) => (
                    <img key={photo} src={photo} alt={selectedGallery.title} />
                  ))}
                </div>
              ) : (
                <div className="admin-gallery-empty-preview">
                  No photos uploaded yet.
                </div>
              )}
            </div>

            <div className="admin-gallery-actions">
              <button type="button">Edit Gallery</button>
              <button type="button">Upload More Photos</button>

              {selectedGallery.status !== "Published" ? (
                <button type="button">Publish to Online Gallery</button>
              ) : (
                <button type="button">Unpublish Gallery</button>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

export default AdminGalleries;