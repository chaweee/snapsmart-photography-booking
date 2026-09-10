import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout?: () => void;
}

type SectionId =
  | "home"
  | "packages"
  | "how-it-works"
  | "about"
  | "contact";

const sectionIds: SectionId[] = [
  "home",
  "packages",
  "how-it-works",
  "about",
  "contact",
];

function Navbar({ isLoggedIn, onLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("home");

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    const updateActiveSection = () => {
      const navbarOffset = 150;
      const currentPosition = window.scrollY + navbarOffset;

      const reachedBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10;

      if (reachedBottom) {
        setActiveSection("contact");
        return;
      }

      let currentSection: SectionId = "home";

      sectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);

        if (section && section.offsetTop <= currentPosition) {
          currentSection = sectionId;
        }
      });

      setActiveSection(currentSection);
    };

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [location.pathname]);

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: SectionId,
  ) => {
    event.preventDefault();
    closeMenu();

    if (location.pathname !== "/") {
      navigate("/");

      window.setTimeout(() => {
        const section = document.getElementById(sectionId);

        if (sectionId === "home") {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        } else {
          section?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);

      return;
    }

    if (sectionId === "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.history.replaceState(null, "", "/");
      return;
    }

    const section = document.getElementById(sectionId);

    section?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(null, "", `/#${sectionId}`);
  };

  const sectionClass = (sectionId: SectionId) =>
    activeSection === sectionId && location.pathname === "/"
      ? "navbar-section-link active"
      : "navbar-section-link";

  const isRouteActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="site-header">
      <div className="navbar-container">
        <Link
          to="/"
          className="navbar-brand"
          onClick={(event) => {
            if (location.pathname === "/") {
              event.preventDefault();

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });

              window.history.replaceState(null, "", "/");
            }

            closeMenu();
          }}
        >
          <div className="navbar-brand-mark">S</div>

          <div className="navbar-brand-copy">
            <span className="navbar-brand-name">SNAPSMART</span>

            <span className="navbar-brand-subtitle">Toni Photography</span>
          </div>
        </Link>

        <button
          type="button"
          className={`mobile-menu-button ${mobileMenuOpen ? "active" : ""}`}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`navbar-navigation ${mobileMenuOpen ? "mobile-open" : ""}`}
        >
          <div className="navbar-links">
            <a
              href="#home"
              className={sectionClass("home")}
              aria-current={activeSection === "home" ? "page" : undefined}
              onClick={(event) => handleSectionClick(event, "home")}
            >
              Home
            </a>

            <Link
              to="/portfolio"
              className={isRouteActive("/portfolio") ? "active" : ""}
              onClick={closeMenu}
            >
              Portfolio
            </Link>

            <a
              href="#packages"
              className={sectionClass("packages")}
              aria-current={
                activeSection === "packages" ? "location" : undefined
              }
              onClick={(event) => handleSectionClick(event, "packages")}
            >
              Packages
            </a>

            {!isLoggedIn && (
              <>
                <a
                  href="#how-it-works"
                  className={sectionClass("how-it-works")}
                  aria-current={
                    activeSection === "how-it-works" ? "location" : undefined
                  }
                  onClick={(event) => handleSectionClick(event, "how-it-works")}
                >
                  How It Works
                </a>

                <a
                  href="#about"
                  className={sectionClass("about")}
                  aria-current={
                    activeSection === "about" ? "location" : undefined
                  }
                  onClick={(event) => handleSectionClick(event, "about")}
                >
                  About
                </a>

                <a
                  href="#contact"
                  className={sectionClass("contact")}
                  aria-current={
                    activeSection === "contact" ? "location" : undefined
                  }
                  onClick={(event) => handleSectionClick(event, "contact")}
                >
                  Contact
                </a>
              </>
            )}

            {isLoggedIn && (
              <>
                <Link
                  to="/book"
                  className={isRouteActive("/book") ? "active" : ""}
                  onClick={closeMenu}
                >
                  Book Now
                </Link>

                <Link
                  to="/client/bookings"
                  className={
                    isRouteActive("/client/bookings") ? "active" : ""
                  }
                  onClick={closeMenu}
                >
                  My Bookings
                </Link>

                <Link
                  to="/client/galleries"
                  className={
                    isRouteActive("/client/galleries") ? "active" : ""
                  }
                  onClick={closeMenu}
                >
                  My Galleries
                </Link>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className={`navbar-login ${
                    isRouteActive("/login") ? "active" : ""
                  }`}
                  onClick={closeMenu}
                >
                  Log In
                </Link>

                <Link
  to="/book"
  className="navbar-book-button"
  onClick={closeMenu}
>
  Book Now
</Link>
              </>
            ) : (
              <>
                <Link
                  to="/client/notifications"
                  className={`navbar-notification ${
                    isRouteActive("/client/notifications") ? "active" : ""
                  }`}
                  onClick={closeMenu}
                >
                  <span className="notification-dot" />

                  Notifications
                </Link>

                <Link
                  to="/client/profile"
                  className={`navbar-account-button ${
                    isRouteActive("/client/profile") ? "active" : ""
                  }`}
                  onClick={closeMenu}
                >
                  My Account
                </Link>

                {onLogout && (
                  <button
                    type="button"
                    className="navbar-logout-button"
                    onClick={() => {
                      onLogout();
                      closeMenu();
                    }}
                  >
                    Log Out
                  </button>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;