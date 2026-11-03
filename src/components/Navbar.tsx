import { useState, type FunctionComponent, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/authContext";
import ClientNotificationBell from "./ClientNotificationBell";

interface NavbarProps {
  isLoggedIn?: boolean;
}

type SectionId = "packages" | "how-it-works" | "about" | "contact";

const Navbar: FunctionComponent<NavbarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(location.pathname);

  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setIsMobileOpen(false);
  }

  const closeMenu = () => {
    setIsMobileOpen(false);
  };

  const handleSectionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: SectionId,
  ) => {
    event.preventDefault();
    closeMenu();

    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      window.alert("Could not log out. Please try again.");
      return;
    }
    closeMenu();
    navigate("/");
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "navbar-link active" : "navbar-link";

  const publicLinks = (
    <>
      <NavLink to="/" end className={getLinkClass} onClick={closeMenu}>
        Home
      </NavLink>

      <NavLink to="/portfolio" className={getLinkClass} onClick={closeMenu}>
        Portfolio
      </NavLink>

      <a
        href="/#packages"
        onClick={(event) => handleSectionClick(event, "packages")}
      >
        Packages
      </a>

      <a
        href="/#how-it-works"
        onClick={(event) => handleSectionClick(event, "how-it-works")}
      >
        How It Works
      </a>

      <a href="/#about" onClick={(event) => handleSectionClick(event, "about")}>
        About
      </a>

      <a
        href="/#contact"
        onClick={(event) => handleSectionClick(event, "contact")}
      >
        Contact
      </a>
    </>
  );

  const clientLinks = (
    <>
      <NavLink to="/" end className={getLinkClass} onClick={closeMenu}>
        Home
      </NavLink>

      <NavLink to="/book" className={getLinkClass} onClick={closeMenu}>
        Book Now
      </NavLink>

      <NavLink to="/portfolio" className={getLinkClass} onClick={closeMenu}>
        Portfolio
      </NavLink>

      <NavLink
        to="/client/bookings"
        className={getLinkClass}
        onClick={closeMenu}
      >
        My Bookings
      </NavLink>

      <NavLink
        to="/client/galleries"
        className={getLinkClass}
        onClick={closeMenu}
      >
        My Galleries
      </NavLink>

    

      <button
        type="button"
        className="navbar-logout-button"
        onClick={handleLogout}
      >
        Log Out
      </button>
    </>
  );

  return (
    <header className="site-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-brand-mark">S</span>

          <span className="navbar-brand-copy">
            <span className="navbar-brand-name">SNAPSMART</span>
            <span className="navbar-brand-subtitle">Toni Photography</span>
          </span>
        </Link>

        {session && role === "client" && <ClientNotificationBell />}

        <button
          type="button"
          className={
            isMobileOpen ? "mobile-menu-button active" : "mobile-menu-button"
          }
          aria-label="Toggle navigation menu"
          onClick={() => setIsMobileOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={
            isMobileOpen
              ? "navbar-navigation mobile-open"
              : "navbar-navigation"
          }
        >
          <div className="navbar-links">
            {session && role === "client" ? clientLinks : publicLinks}
          </div>

          {session && role !== "client" && (
            <div className="navbar-actions">
              <span className="navbar-role-label">
                {loading ? "Loading account…" : role === "admin" ? "Admin account" : role === "photographer" ? "Photographer account" : role === "videographer" ? "Videographer account" : "Account"}
              </span>
              {role === "admin" && <Link to="/admin" className="navbar-account-button" onClick={closeMenu}>Admin Dashboard</Link>}
              {(role === "photographer" || role === "videographer") && <Link to="/photographer" className="navbar-account-button" onClick={closeMenu}>Team Portal</Link>}
              <button type="button" className="navbar-logout-button" onClick={handleLogout}>Log Out</button>
            </div>
          )}

          {!session && !loading && (
            <div className="navbar-actions">
              <Link to="/login" className="navbar-login" onClick={closeMenu}>
                Log In
              </Link>

              <Link
                to="/login"
                className="navbar-book-button"
                onClick={closeMenu}
              >
                Book Now
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
