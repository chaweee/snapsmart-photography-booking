import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { preloadAdminPages } from "../lib/adminPageLoaders";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../lib/toast";
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
  // Download the other admin pages in the background so switching pages is instant.
  useEffect(() => { preloadAdminPages(); }, []);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Mobile: the sidebar becomes a slide-in drawer opened from the top bar.
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [menuOpen]);
  // Logging out asks for confirmation first.
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const showToast = useToast();
  const handleLogout = async () => {
    // Leave the protected page first, then sign out. Signing out while still on
    // an admin/team/client page made its login guard redirect to /login instead.
    setLoggingOut(true);
    setConfirmLogout(false);
    navigate("/", { replace: true });
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);
    if (error) showToast("Couldn't log out. Try again.", { type: "error" });
  };
  return (
    <div className="admin-layout">
      <ConfirmDialog open={confirmLogout} title="Log out?" message="You'll need to sign in again to access your account." confirmLabel="Log out" busy={loggingOut} onConfirm={() => void handleLogout()} onCancel={() => setConfirmLogout(false)} />
      {menuOpen && <div className="admin-drawer-backdrop" aria-hidden="true" onClick={() => setMenuOpen(false)} />}
      <aside id="admin-sidebar" className={menuOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <button type="button" className="admin-drawer-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button>
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

        <button type="button" className="admin-drawer-logout" onClick={() => setConfirmLogout(true)}>Log out</button>
      </aside>

      <div className="admin-content-area">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="admin-topbar-title">
            <p>Admin Workspace</p>
            <h1>Toni Photography Management</h1>
          </div>

          <div className="admin-topbar-actions">
            <AdminNotificationBell />
            <div className="admin-profile">
              <span>Admin</span>
              <div>A</div>
            </div>
            <button className="admin-topbar-logout" type="button" onClick={() => setConfirmLogout(true)}>Log out</button>
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
