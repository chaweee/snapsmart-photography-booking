import "./Admin.css";

interface AdminPackage {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  category: string;
  status: "Active" | "Inactive";
  inclusions: string[];
}

const adminPackages: AdminPackage[] = [
  {
    id: "PKG-001",
    name: "Captured Moments",
    subtitle: "Photo Coverage Only",
    price: "₱9,000",
    category: "Photo",
    status: "Active",
    inclusions: [
      "Coffee Table Album (100pcs 5R Pictures)",
      "Photoshoot / Pre-Nuptial Shoot",
      "2pcs 8R Size Picture with Elegant Frame",
      "2x5 Tarpaulin",
      "8GB Flash Drive",
    ],
  },
  {
    id: "PKG-002",
    name: "Storyteller",
    subtitle: "Photo & Video Coverage",
    price: "₱16,000",
    category: "Photo + Video",
    status: "Active",
    inclusions: [
      "Coffee Table Album",
      "Photoshoot / Pre-Nuptial Shoot",
      "1pc 11x14 Picture with Elegant Frame",
      "1pc 8R Picture with Elegant Frame",
      "2x3 Tarpaulin",
      "2x5 Tarpaulin",
      "32GB Flash Drive",
      "Full Edited Video Coverage",
    ],
  },
  {
    id: "PKG-003",
    name: "Storyteller + Guestbook",
    subtitle: "Photo & Video Coverage with Guestbook",
    price: "₱19,000",
    category: "Photo + Video",
    status: "Active",
    inclusions: [
      "Coffee Table Album",
      "Photoshoot / Pre-Nuptial Shoot",
      "1pc 11x14 Picture with Elegant Frame",
      "1pc 8R Picture with Elegant Frame",
      "2x3 Tarpaulin",
      "2x5 Tarpaulin",
      "32GB Flash Drive",
      "Full Edited Video Coverage",
      "Guestbook (10pcs 8R Guestbook Album)",
    ],
  },
  {
    id: "PKG-004",
    name: "Signature Experience",
    subtitle: "Photo & Video Coverage",
    price: "₱30,000",
    category: "Premium",
    status: "Active",
    inclusions: [
      "40-Page Magazine Album (8x10)",
      "Pre-Nuptial Shoot",
      "10 Page Pre-Nuptial Guestbook",
      "11x14 Signature Frame",
      "2 Framed 11x14 Prints",
      "2x3 Tarpaulin",
      "2x5 Tarpaulin",
      "Save The Date Video",
      "Wedding Highlights Video",
      "Full Coverage Video",
      "32GB Flash Drive",
    ],
  },
  {
    id: "PKG-005",
    name: "Digital Keepsake Basic",
    subtitle: "Soft Copies Only",
    price: "₱4,500",
    category: "Digital",
    status: "Active",
    inclusions: [
      "Whole Event Soft Copies",
      "8GB Flash Drive",
    ],
  },
  {
    id: "PKG-006",
    name: "Digital Keepsake Plus",
    subtitle: "Soft Copies Only with Photoshoot",
    price: "₱6,500",
    category: "Digital",
    status: "Active",
    inclusions: [
      "Whole Event Soft Copies",
      "8GB Flash Drive",
      "Photoshoot / Pre-Nuptial",
    ],
  },
];

function AdminPackages() {
  return (
    <div className="admin-packages-page">
      <section className="admin-page-heading">
        <div>
          <p>Manage Packages</p>
          <h2>Photography packages</h2>
        </div>

        <div className="dashboard-actions">
          <button type="button">Add Package</button>
          <button type="button">Export Packages</button>
        </div>
      </section>

      <section className="package-summary-grid">
        <article className="overview-card">
          <span>Total Packages</span>
          <strong>{adminPackages.length}</strong>
          <p>Available package records</p>
        </article>

        <article className="overview-card">
          <span>Active Packages</span>
          <strong>
            {
              adminPackages.filter(
                (item) => item.status === "Active",
              ).length
            }
          </strong>
          <p>Shown to clients</p>
        </article>

        <article className="overview-card">
          <span>Starting Price</span>
          <strong>₱4,500</strong>
          <p>Lowest package price</p>
        </article>

        <article className="overview-card">
          <span>Highest Package</span>
          <strong>₱30,000</strong>
          <p>Premium package price</p>
        </article>
      </section>

      <section className="admin-package-grid">
        {adminPackages.map((item) => (
          <article className="admin-package-card" key={item.id}>
            <div className="admin-package-card-top">
              <div>
                <span>{item.id}</span>
                <h3>{item.name}</h3>
                <p>{item.subtitle}</p>
              </div>

              <strong>{item.price}</strong>
            </div>

            <div className="admin-package-meta">
              <span>{item.category}</span>
              <span className="package-status-pill">{item.status}</span>
            </div>

            <div className="admin-package-inclusions">
              <h4>Inclusions</h4>

              <ul>
                {item.inclusions.map((inclusion) => (
                  <li key={inclusion}>{inclusion}</li>
                ))}
              </ul>
            </div>

            <div className="admin-package-actions">
              <button type="button">View Details</button>
              <button type="button">Edit Package</button>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-panel package-table-panel">
        <div className="admin-panel-heading">
          <div>
            <p>Package Records</p>
            <h3>Package list</h3>
          </div>

          <button type="button">Manage Pricing</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Package ID</th>
                <th>Package Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>No. of Inclusions</th>
              </tr>
            </thead>

            <tbody>
              {adminPackages.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <span>{item.subtitle}</span>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.price}</td>
                  <td>
                    <span className="status-pill">{item.status}</span>
                  </td>
                  <td>{item.inclusions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminPackages;