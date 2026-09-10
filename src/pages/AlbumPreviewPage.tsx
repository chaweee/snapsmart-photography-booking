import Navbar from "../components/Navbar";
import "./AlbumPreviewPage.css";

const previewSamples = [
  {
    id: "album-sample",
    label: "Album Model",
    title: "Wedding Album Preview",
    description:
      "A sample interactive 3D photo album that can represent a finished client album deliverable.",
    bookingId: "BK-2026-001",
    bookingLabel: "Maria Santos Wedding Gallery",
    packageName: "Storyteller",
    purpose: "Album deliverable preview",
    embedUrl:
      "https://sketchfab.com/3d-models/mdm-katie-low-ah-mois-photo-album-0b36fac70f7243cdb726b651dd771950/embed",
  },
  {
    id: "frame-sample",
    label: "Frame Model",
    title: "Picture Frame Preview",
    description:
      "A sample interactive 3D picture frame that can represent framed print deliverables included in selected packages.",
    bookingId: "BK-2026-002",
    bookingLabel: "Captured Moments Framed Print",
    packageName: "Captured Moments",
    purpose: "Framed print deliverable preview",
    embedUrl:
      "https://sketchfab.com/3d-models/picture-frame-a94047d9c35a4db98e5737e47a61ffb5/embed",
  },
];

function AlbumPreviewPage() {
  return (
    <div className="album-preview-page">
      <Navbar isLoggedIn={false} />

      <main className="album-preview-main">
        <section className="album-preview-hero">
          <div className="album-preview-copy">
            <p>Interactive Deliverable Preview</p>
            <h1>3D Album & Frame Samples</h1>
            <span>
              A sample page showing how clients can preview album and framed
              photo deliverables as interactive 3D models.
            </span>
          </div>

          <div className="album-preview-status">
            <strong>Sample Only</strong>
            <span>For SNAPSMART presentation preview</span>
          </div>
        </section>

        <div className="album-preview-sample-list">
          {previewSamples.map((sample) => (
            <section key={sample.id} className="album-preview-content">
              <div className="album-preview-frame-card">
                <div className="album-preview-frame-header">
                  <div>
                    <p>{sample.label}</p>
                    <h2>{sample.title}</h2>
                  </div>

                  <span>Drag • Zoom • Rotate</span>
                </div>

                <div className="album-preview-frame">
                  <iframe
                    title={sample.title}
                    src={sample.embedUrl}
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    allowFullScreen
                  />
                </div>
              </div>

              <aside className="album-preview-details">
                <div className="album-preview-detail-card">
                  <span>Booking Sample</span>
                  <strong>{sample.bookingId}</strong>
                  <p>{sample.bookingLabel}</p>
                </div>

                <div className="album-preview-detail-card">
                  <span>Package</span>
                  <strong>{sample.packageName}</strong>
                  <p>{sample.description}</p>
                </div>

                <div className="album-preview-detail-card">
                  <span>Purpose</span>
                  <strong>{sample.purpose}</strong>
                  <p>
                    This demonstrates how SNAPSMART can present physical
                    deliverables through an interactive 3D preview.
                  </p>
                </div>

                <div className="album-preview-note">
                  <strong>Note</strong>
                  <p>
                    This is a mockup sample. Later, each 3D preview can be linked
                    to a specific client booking, gallery, or package deliverable.
                  </p>
                </div>
              </aside>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AlbumPreviewPage;