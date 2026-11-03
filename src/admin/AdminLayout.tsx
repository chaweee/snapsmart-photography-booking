import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminNotificationBell from "./AdminNotificationBell";
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
    label: "Portfolio",
    path: "/admin/portfolio",
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
];

function AdminLayout() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      window.alert("Could not log out. Please try again.");
      return;
    }
    navigate("/login");
  };
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
        <div className="admin-session-actions">
          <Link to="/">View website</Link>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <div className="admin-content-area">
        <header className="admin-topbar">
          <div>
            <p>Admin Workspace</p>
            <h1>Toni Photography Management</h1>
          </div>

          <div className="admin-topbar-actions">
            <AdminNotificationBell />
            <div className="admin-profile">
              <span>Admin</span>
              <div>A</div>
            </div>
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
