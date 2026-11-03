import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/hero.png";

interface HomePageProps {
  isLoggedIn: boolean;
}

function HomePage({ isLoggedIn }: HomePageProps) {
  const bookingDestination = isLoggedIn ? "/book" : "/login";

  return (
    <div className="home-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <main>
        <section className="home-hero" id="home">
          <div className="home-shell hero-layout">
            <div className="hero-copy">
              <p className="section-eyebrow">TONI PHOTOGRAPHY</p>

              <h1>
                Your story deserves
                <span> to be remembered.</span>
              </h1>

              <p className="hero-description">
                From weddings and birthdays to life's most meaningful
                celebrations, Toni Photography captures the moments you never
                want to forget.
              </p>

              <div className="hero-actions">
                <Link to={bookingDestination} className="button button-dark">
                  Book a Session
                  <span aria-hidden="true">→</span>
                </Link>

                <a href="#packages" className="button button-outline">
                  Explore Packages
                </a>
              </div>

              <div className="hero-benefits">
                <div>
                  <span className="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m6 5 2 2 4-4"/></svg></span>
                  <p>Easy online booking</p>
                </div>

                <div>
                  <span className="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v5c0 4.5 3 7.5 8 10 5-2.5 8-5.5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg></span>
                  <p>Secure client portal</p>
                </div>

                <div>
                  <span className="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 2-2 6 5"/></svg></span>
                  <p>Private photo galleries</p>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-frame">
                <img
                  src={heroImage}
                  alt="Photography by Toni Photography"
                  className="hero-main-image"
                />

                <div className="hero-image-overlay" />

                <div className="hero-location-card">
                  <span className="location-line" />

                  <div>
                    <strong>Toni Photography</strong>
                    <span>Balayan, Batangas</span>
                  </div>
                </div>
              </div>

              <div className="hero-floating-card">
                <span className="floating-label">A simpler way to book</span>

                <strong>
                  Your session.
                  <br />
                  Your memories.
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="experience-strip">
          <div className="home-shell experience-strip-inner">
            <span>WEDDINGS</span>
            <span className="strip-dot">•</span>
            <span>BIRTHDAYS</span>
            <span className="strip-dot">•</span>
            <span>DEBUTS</span>
            <span className="strip-dot">•</span>
            <span>CHRISTENINGS</span>
            <span className="strip-dot">•</span>
            <span>SPECIAL EVENTS</span>
          </div>
        </section>

        <section className="home-section packages-section" id="packages">
          <div className="home-shell">
            <div className="section-heading section-heading-split">
              <div>
                <p className="section-eyebrow">PHOTOGRAPHY SERVICES</p>

                <h2>
                  Moments are different.
                  <br />
                  Your experience should be too.
                </h2>
              </div>

              <div className="section-heading-copy">
                <p>
                  Choose the photography service that best fits your occasion.
                  Full package details and availability will be available
                  through SNAPSMART.
                </p>
              </div>
            </div>

            <div className="package-grid">
              <article className="package-card package-card-featured">
                <div className="package-number">01</div>

                <div className="package-content">
                  <p className="package-label">TIMELESS CELEBRATIONS</p>
                  <h3>Wedding Photography</h3>

                  <p>
                    Thoughtful coverage for one of life's biggest chapters,
                    from the quiet moments to the celebration itself.
                  </p>

                  <Link to={bookingDestination}>
                    View booking options <span>→</span>
                  </Link>
                </div>
              </article>

              <article className="package-card">
                <div className="package-number">02</div>

                <div className="package-content">
                  <p className="package-label">MILESTONES</p>
                  <h3>Birthdays &amp; Debuts</h3>

                  <p>
                    Capture the people, details, and energy that make milestone
                    celebrations worth remembering.
                  </p>

                  <Link to={bookingDestination}>
                    View booking options <span>→</span>
                  </Link>
                </div>
              </article>

              <article className="package-card">
                <div className="package-number">03</div>

                <div className="package-content">
                  <p className="package-label">MEANINGFUL OCCASIONS</p>
                  <h3>Special Events</h3>

                  <p>
                    Photography for christenings, family celebrations, and
                    other meaningful occasions.
                  </p>

                  <Link to={bookingDestination}>
                    View booking options <span>→</span>
                  </Link>
                </div>
              </article>
            </div>

            <p className="package-note">
              Actual photography packages, inclusions, and pricing will be
              managed by Toni Photography through the SNAPSMART admin system.
            </p>
          </div>
        </section>

        <section className="home-section booking-process" id="how-it-works">
          <div className="home-shell">
            <div className="section-heading centered-heading">
              <p className="section-eyebrow">HOW BOOKING WORKS</p>

              <h2>
                From inquiry to confirmed,
                <br />
                without the back-and-forth.
              </h2>

              <p>
                SNAPSMART keeps the important parts of your reservation
                organized in one place.
              </p>
            </div>

            <div className="process-grid">
              <article className="process-step">
                <span className="process-number">01</span>
                <div className="process-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6l1.5-2h5L16 6"/><circle cx="12" cy="13" r="3.5"/></svg></div>

                <h3>Choose a Package</h3>

                <p>
                  Browse available photography services and choose the option
                  that fits your event.
                </p>
              </article>

              <article className="process-step">
                <span className="process-number">02</span>
                <div className="process-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-12 4h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01"/></svg></div>

                <h3>Pick Your Date</h3>

                <p>
                  Select your event date and provide the details Toni
                  Photography needs for your booking.
                </p>
              </article>

              <article className="process-step">
                <span className="process-number">03</span>
                <div className="process-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4H5v16h14v-7M8 9h5M8 13h4M8 17h3"/><path d="m14 14 6-6-2-2-6 6-.5 2.5L14 14Z"/></svg></div>

                <h3>Review &amp; E-Sign</h3>

                <p>
                  Review the booking agreement, confirm your information, and
                  provide your electronic signature.
                </p>
              </article>

              <article className="process-step">
                <span className="process-number">04</span>
                <div className="process-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18m-14 5h4"/></svg></div>

                <h3>Send Down Payment</h3>

                <p>
                  Send the required down payment through GCash or bank transfer
                  and upload your payment proof.
                </p>
              </article>

              <article className="process-step">
                <span className="process-number">05</span>
                <div className="process-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg></div>

                <h3>You're Confirmed</h3>

                <p>
                  Once payment is verified, your booking is confirmed and your
                  contract becomes available.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="home-section client-experience-section">
          <div className="home-shell client-experience-layout">
            <div className="client-experience-copy">
              <p className="section-eyebrow">YOUR CLIENT PORTAL</p>

              <h2>
                Everything about your booking,
                <span> kept together.</span>
              </h2>

              <p className="client-experience-description">
                Once you create an account, SNAPSMART gives you one secure place
                to follow your booking from reservation through final photo
                delivery.
              </p>

              <div className="experience-feature-list">
                <div className="experience-feature">
                  <span>01</span>

                  <div>
                    <h3>Track your booking</h3>
                    <p>
                      Check confirmation status, event information, and upcoming
                      schedules.
                    </p>
                  </div>
                </div>

                <div className="experience-feature">
                  <span>02</span>

                  <div>
                    <h3>Manage payments &amp; contracts</h3>
                    <p>
                      Review down payments, remaining balances, and your
                      confirmed photography contract.
                    </p>
                  </div>
                </div>

                <div className="experience-feature">
                  <span>03</span>

                  <div>
                    <h3>Access private galleries</h3>
                    <p>
                      View your finished photographs through your secured client
                      gallery when they're ready.
                    </p>
                  </div>
                </div>

                <div className="experience-feature">
                  <span>04</span>

                  <div>
                    <h3>Stay updated</h3>
                    <p>
                      Receive booking, payment, schedule, and gallery
                      notifications in one place.
                    </p>
                  </div>
                </div>
              </div>

              <Link to={bookingDestination} className="text-link">
                {isLoggedIn ? "Start a new booking" : "Create your client account"}
                <span>→</span>
              </Link>
            </div>

            <div className="portal-preview">
              <div className="portal-window">
                <div className="portal-window-top"><span>CLIENT PORTAL</span></div>
                <div className="portal-body"><div className="portal-welcome"><div><span>YOUR ACCOUNT</span><h3>Your moments, in one place</h3></div></div><p>Log in to view your bookings and private galleries when they become available.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section about-section" id="about">
          <div className="home-shell about-layout">
            <div className="about-label">
              <p className="section-eyebrow">ABOUT TONI PHOTOGRAPHY</p>
            </div>

            <div className="about-copy">
              <h2>
                Photography built around
                <span> the moments that matter.</span>
              </h2>

              <p>
                Based in Balayan, Batangas, Toni Photography provides
                photography services for weddings, birthdays, and other special
                occasions.
              </p>

              <p>
                SNAPSMART makes the experience more organized by bringing
                bookings, schedules, payments, contracts, notifications, and
                secured galleries into one convenient client platform.
              </p>

              <Link to={bookingDestination} className="text-link">
                Book with Toni Photography <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="home-cta">
          <div className="home-shell cta-inner">
            <div>
              <p className="section-eyebrow light-eyebrow">
                READY WHEN YOU ARE
              </p>

              <h2>
                Let's turn your next moment
                <br />
                into something worth keeping.
              </h2>
            </div>

            <Link to={bookingDestination} className="button button-light">
              Book Your Session <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="home-shell">
          <div className="footer-main">
            <div className="footer-brand-column">
              <Link to="/" className="footer-brand">
                <div className="navbar-brand-mark">S</div>

                <div>
                  <span className="navbar-brand-name">SNAPSMART</span>
                  <span className="navbar-brand-subtitle">
                    Toni Photography
                  </span>
                </div>
              </Link>

              <p>
                A simpler photography booking experience for the moments that
                matter.
              </p>
            </div>

            <div className="footer-column">
              <h3>Explore</h3>
              <a href="#home">Home</a>
              <a href="#packages">Packages</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#about">About</a>
            </div>

            <div className="footer-column">
              <h3>Client</h3>

              <Link to="/login">Log In</Link>
              <Link to="/signup">Create Account</Link>
              <Link to={bookingDestination}>Book a Session</Link>
            </div>

            <div className="footer-column">
              <h3>Location</h3>

              <p>Balayan, Batangas</p>
              <p>Philippines</p>
              <h3>Contact</h3>
              <a href="https://facebook.com/toniPh0tography" target="_blank" rel="noopener noreferrer">Toni Photography on Facebook ↗</a>
              <a href="tel:09671341211">0967-134-1211</a>
              <a href="tel:09555133703">0955-513-3703</a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Toni Photography. All rights reserved.</span>

            <div>
              <button type="button">Privacy</button>
              <button type="button">Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
