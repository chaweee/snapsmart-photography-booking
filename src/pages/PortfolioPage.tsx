import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/hero.png";
import "./PortfolioPage.css";

interface PortfolioPageProps {
  isLoggedIn: boolean;
}

const portfolioCategories = [
  "All",
  "Wedding",
  "Birthday",
  "Debut",
  "Christening",
  "Family",
  "Special Events",
];

const portfolioItems = [
  {
    id: 1,
    title: "Wedding Moments",
    category: "Wedding",
    image: heroImage,
    description: "Elegant wedding coverage for meaningful celebrations.",
  },
  {
    id: 2,
    title: "Pre-Nuptial Stories",
    category: "Wedding",
    image: heroImage,
    description: "Romantic pre-nuptial sessions captured with warmth.",
  },
  {
    id: 3,
    title: "Birthday Celebrations",
    category: "Birthday",
    image: heroImage,
    description: "Colorful birthday memories for families and children.",
  },
  {
    id: 4,
    title: "Debut Highlights",
    category: "Debut",
    image: heroImage,
    description: "Milestone celebrations captured with elegance.",
  },
  {
    id: 5,
    title: "Christening Memories",
    category: "Christening",
    image: heroImage,
    description: "Soft and meaningful coverage for family occasions.",
  },
  {
    id: 6,
    title: "Family Portraits",
    category: "Family",
    image: heroImage,
    description: "Portrait sessions for families and loved ones.",
  },
];

function PortfolioPage({ isLoggedIn }: PortfolioPageProps) {
  const bookingDestination = "/book";

  return (
    <div className="portfolio-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="portfolio-main">
        <section className="portfolio-hero">
          <div className="portfolio-shell portfolio-hero-layout">
            <div>
              <p className="portfolio-eyebrow">TONI PHOTOGRAPHY PORTFOLIO</p>

              <h1>
                View our work
                <span> before you book.</span>
              </h1>

              <p>
                Browse sample works from Toni Photography, including weddings,
                birthdays, debuts, christenings, family portraits, and special
                events.
              </p>
            </div>

            <div className="portfolio-hero-card">
              <span>PUBLIC ONLINE GALLERY</span>

              <strong>Portfolio Preview</strong>

              <p>
                This page is for public sample works. Client photo galleries
                will be private and accessible only through the secured client
                portal.
              </p>
            </div>
          </div>
        </section>

        <section className="portfolio-content">
          <div className="portfolio-shell">
            <div className="portfolio-toolbar">
              <div>
                <p className="portfolio-eyebrow">GALLERY CATEGORIES</p>
                <h2>Explore by event type</h2>
              </div>

              <Link to={bookingDestination} className="portfolio-book-link">
                Book a Session <span>→</span>
              </Link>
            </div>

            <div className="portfolio-categories">
              {portfolioCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === "All" ? "active" : ""}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="portfolio-grid">
              {portfolioItems.map((item) => (
                <article className="portfolio-card" key={item.id}>
                  <div className="portfolio-image-wrap">
                    <img src={item.image} alt={item.title} />
                    <span>{item.category}</span>
                  </div>

                  <div className="portfolio-card-copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="portfolio-note">
              <strong>Temporary images:</strong> These cards currently reuse the
              homepage image. Once you provide Toni Photography’s actual sample
              photos, we can replace them with real portfolio albums and connect
              them to Supabase Storage.
            </div>
          </div>
        </section>

        <section className="portfolio-cta">
          <div className="portfolio-shell portfolio-cta-inner">
            <div>
              <p className="portfolio-eyebrow">READY TO BOOK?</p>

              <h2>
                Found the style you like?
                <span> Let’s reserve your date.</span>
              </h2>
            </div>

            <Link to={bookingDestination}>Start Booking →</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PortfolioPage;