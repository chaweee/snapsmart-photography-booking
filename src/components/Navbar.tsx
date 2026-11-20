import { useEffect, useRef, useState, type FunctionComponent, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/authContext";
import ClientNotificationBell from "./ClientNotificationBell";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "../lib/toast";

interface NavbarProps {
  isLoggedIn?: boolean;
}

type SectionId = "packages" | "how-it-works" | "about" | "contact";
type ActiveSection = "home" | SectionId;

// Landing page sections in page order, used for the scroll-spy.
const SECTION_ORDER: ActiveSection[] = ["home", "packages", "how-it-works", "about", "contact"];

const Navbar: FunctionComponent<NavbarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Logging out asks for confirmation first.
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const showToast = useToast();
  // Section named in the URL hash (e.g. "/#packages" when arriving from another page).
  const hashSection = SECTION_ORDER.find((id) => id !== "home" && location.hash === `#${id}`);
  const [menuPath, setMenuPath] = useState(location.pathname);
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => hashSection ?? "home");
  // While a nav click is smooth-scrolling, keep the clicked link active
  // instead of flickering through the sections being scrolled past.
  const scrollLockRef = useRef(false);
  const isHome = location.pathname === "/";

  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setIsMobileOpen(false);
    // Coming back to "/" (e.g. Portfolio → Packages): highlight the target section
    // right away, so "Home" never flashes before the page scrolls there.
    if (location.pathname === "/") setActiveSection(hashSection ?? "home");
  }

  useEffect(() => {
    if (!isHome) return;

    let frame = 0;
    let unlockTimer = 0;
    // When the URL targets a section, ScrollToTop scrolls there shortly after load.
    // Hold the highlight on that section until that scroll finishes.
    const lockedForHash = !!hashSection;
    if (lockedForHash) scrollLockRef.current = true;

    const detect = () => {
      frame = 0;
      if (scrollLockRef.current) return;

      const header = document.querySelector<HTMLElement>(".site-header");
      const offset = (header?.offsetHeight ?? 0) + 24;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      let current: ActiveSection = "home";
      if (atBottom) {
        current = "contact";
      } else {
        for (const id of SECTION_ORDER) {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= offset) current = id;
        }
      }
      setActiveSection(current);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(detect);
    };

    const unlock = () => {
      if (!scrollLockRef.current) return;
      scrollLockRef.current = false;
      schedule();
    };

    const onScroll = () => {
      if (scrollLockRef.current) {
        // Fallback for browsers without `scrollend`: unlock once scrolling pauses.
        window.clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(unlock, 150);
        return;
      }
      schedule();
    };

    if (!lockedForHash) schedule();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scrollend", unlock);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(unlockTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scrollend", unlock);
    };
  }, [isHome, hashSection]);

  const closeMenu = () => {
    setIsMobileOpen(false);
  };

  // Mobile drawer: lock page scroll while it's open and close it with Escape.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsMobileOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [isMobileOpen]);

  const scrollToSection = (sectionId: ActiveSection) => {
    setActiveSection(sectionId);
    scrollLockRef.current = true;

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSectionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: SectionId,
  ) => {
    event.preventDefault();
    closeMenu();

    if (!isHome) {
      navigate(`/#${sectionId}`);
      return;
    }

    scrollToSection(sectionId);
  };

  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    if (!isHome) return;
    event.preventDefault();
    scrollToSection("home");
  };

  const sectionClass = (sectionId: ActiveSection) =>
    isHome && activeSection === sectionId ? "navbar-link active" : "navbar-link";

  const requestLogout = () => {
    closeMenu();
    setConfirmLogout(true);
  };

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

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "navbar-link active" : "navbar-link";

  const publicLinks = (
    <>
      <Link to="/" className={sectionClass("home")} onClick={handleHomeClick}>
        Home
      </Link>

      <NavLink to="/portfolio" className={getLinkClass} onClick={closeMenu}>
        Portfolio
      </NavLink>

      <a
        href="/#packages"
        className={sectionClass("packages")}
        onClick={(event) => handleSectionClick(event, "packages")}
      >
        Packages
      </a>

      <a
        href="/#how-it-works"
        className={sectionClass("how-it-works")}
        onClick={(event) => handleSectionClick(event, "how-it-works")}
      >
        How It Works
      </a>

      <a
        href="/#about"
        className={sectionClass("about")}
        onClick={(event) => handleSectionClick(event, "about")}
      >
        About
      </a>

      <a
        href="/#contact"
        className={sectionClass("contact")}
        onClick={(event) => handleSectionClick(event, "contact")}
      >
        Contact
      </a>
    </>
  );

  const clientLinks = (
    <>
      <Link to="/" className={sectionClass("home")} onClick={handleHomeClick}>
        Home
      </Link>

      <a
        href="/#packages"
        className={sectionClass("packages")}
        onClick={(event) => handleSectionClick(event, "packages")}
      >
        View Packages
      </a>

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
        onClick={requestLogout}
      >
        Log Out
      </button>
    </>
  );

  return (
    <header className="site-header">
      <ConfirmDialog open={confirmLogout} title="Log out?" message="You'll need to sign in again to access your account." confirmLabel="Log out" busy={loggingOut} onConfirm={() => void handleLogout()} onCancel={() => setConfirmLogout(false)} />
      <div className="navbar-container">
        <button
          type="button"
          className={
            isMobileOpen ? "mobile-menu-button active" : "mobile-menu-button"
          }
          aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileOpen}
          aria-controls="site-navigation"
          onClick={() => setIsMobileOpen((current) => !current)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>

        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-brand-mark">S</span>

          <span className="navbar-brand-copy">
            <span className="navbar-brand-name">SNAPSMART</span>
            <span className="navbar-brand-subtitle">Toni Photography</span>
          </span>
        </Link>

        {session && role === "client" && <ClientNotificationBell />}



        {isMobileOpen && <div className="navbar-drawer-backdrop" aria-hidden="true" onClick={closeMenu} />}

        <nav
          id="site-navigation"
          className={
            isMobileOpen
              ? "navbar-navigation mobile-open"
              : "navbar-navigation"
          }
        >
          <div className="navbar-drawer-head">
            <span className="navbar-brand-mark" aria-hidden="true">S</span>
            <span className="navbar-brand-copy">
              <span className="navbar-brand-name">SNAPSMART</span>
              <span className="navbar-brand-subtitle">Toni Photography</span>
            </span>
            <button type="button" className="navbar-drawer-close" aria-label="Close navigation menu" onClick={closeMenu}>×</button>
          </div>
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
              <button type="button" className="navbar-logout-button" onClick={requestLogout}>Log Out</button>
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
