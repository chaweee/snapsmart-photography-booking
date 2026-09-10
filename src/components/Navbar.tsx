import { useEffect, useState, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

interface NavbarProps {
  isLoggedIn?: boolean;
}

type SectionId = "packages" | "how-it-works" | "about" | "contact";

function Navbar({ isLoggedIn = false }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMenu = () => {
    setIsMobileOpen(false);
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

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

  const handleLogout = () => {
    localStorage.removeItem("snapsmartMockUser");
    closeMenu();
    navigate("/");
    window.location.reload();
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

      <NavLink
        to="/client/notifications"
        className={({ isActive }) =>
          isActive
            ? "navbar-link navbar-notification active"
            : "navbar-link navbar-notification"
        }
        onClick={closeMenu}
      >
        <span className="notification-dot" />
        Notifications
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
            {isLoggedIn ? clientLinks : publicLinks}
          </div>

          {!isLoggedIn && (
            <div className="navbar-actions">
              <Link to="/login" className="navbar-login" onClick={closeMenu}>
                Log In
              </Link>

              <Link
                to="/book"
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
}

export default Navbar;