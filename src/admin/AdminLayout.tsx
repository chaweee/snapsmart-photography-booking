import { NavLink, Outlet } from "react-router-dom";
import "./Admin.css";

const adminLinks = [
  {
    label: "Dashboard",
    path: "/admin",
  },
  {
    label: "Bookings",
    path: "/admin/bookings",
  },
  {
    label: "Walk-In Booking",
    path: "/admin/walk-in-booking",
  },
  {
    label: "Calendar",
    path: "/admin/calendar",
  },
  {
    label: "Payments",
    path: "/admin/payments",
  },
  {
    label: "Clients",
    path: "/admin/clients",
  },
  {
    label: "Galleries",
    path: "/admin/galleries",
  },
  {
    label: "Packages",
    path: "/admin/packages",
  },
  {
    label: "Team Members",
    path: "/admin/team-members",
  },
  {
    label: "To-Do List",
    path: "/admin/to-do-list",
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
  },
];

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">S</div>

          <div>
            <strong>SNAPSMART</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          {adminLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/admin"}
              className={({ isActive }) =>
                isActive ? "admin-nav-link active" : "admin-nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-content-area">
        <header className="admin-topbar">
          <div>
            <p>Admin Workspace</p>
            <h1>Toni Photography Management</h1>
          </div>

          <div className="admin-profile">
            <span>Admin</span>
            <div>A</div>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;