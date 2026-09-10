import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.png";

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname !== "/signup";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [location.pathname]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (isLogin) {
      if (email === "client@gmail.com" && password === "client") {
        localStorage.setItem("snapsmartMockUser", "client");
        navigate("/client/bookings");
        return;
      }

      setMessage("Invalid mock account. Use client@gmail.com and password client.");
      return;
    }

    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage(
      "Sign up UI is ready. Supabase authentication will be connected next.",
    );
  };

  return (
    <main className="auth-page">
      <section
        className="auth-visual"
        aria-label="SNAPSMART introduction"
        style={{
          backgroundImage: `linear-gradient(
            145deg,
            rgba(17, 15, 13, 0.18),
            rgba(17, 15, 13, 0.52)
          ), url(${heroImage})`,
        }}
      >
        <div className="visual-overlay" />

        <Link to="/" className="brand">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>

          <div>
            <p className="brand-name">SNAPSMART</p>
            <p className="brand-subtitle">Toni Photography</p>
          </div>
        </Link>

        <div className="visual-content">
          <p className="eyebrow">Capture. Organize. Remember.</p>

          <h1>
            Your moments,
            <br />
            beautifully managed.
          </h1>

          <p className="visual-description">
            Book photography services, track your reservation, and access your
            memories through one secure platform.
          </p>
        </div>

        <p className="visual-footer">
          Photography booking &amp; client management
        </p>
      </section>

      <section className="auth-panel">
        <Link to="/" className="mobile-brand">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>

          <div>
            <p className="brand-name">SNAPSMART</p>
            <p className="brand-subtitle">Toni Photography</p>
          </div>
        </Link>

        <div className="auth-container">
          <button
            type="button"
            className="auth-back-button"
            onClick={() => navigate("/")}
          >
            ← Back to home
          </button>

          <div className="auth-heading">
            <p className="auth-kicker">
              {isLogin ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}
            </p>

            <h2>{isLogin ? "Sign in to SNAPSMART" : "Join SNAPSMART"}</h2>

            <p>
              {isLogin
                ? "Access your bookings, agreements, payments, and galleries."
                : "Create your client account to start booking photography services."}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={isLogin ? "auth-tab active" : "auth-tab"}
              onClick={() => navigate("/login")}
            >
              Log In
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={!isLogin ? "auth-tab active" : "auth-tab"}
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="field-group">
                  <label htmlFor="fullName">Full Name</label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="phone">Phone Number</label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    autoComplete="tel"
                    required
                  />
                </div>
              </>
            )}

            <div className="field-group">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="client@gmail.com"
                autoComplete="email"
                defaultValue={isLogin ? "client@gmail.com" : ""}
                required
              />
            </div>

            <div className="field-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>

                {isLogin && (
                  <button
                    className="forgot-password"
                    type="button"
                    onClick={() =>
                      setMessage(
                        "Password recovery will be connected when Supabase Auth is added.",
                      )
                    }
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "client" : "Enter your password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  defaultValue={isLogin ? "client" : ""}
                  minLength={isLogin ? 1 : 8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="field-group">
                <label htmlFor="confirmPassword">Confirm Password</label>

                <div className="password-field">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <label className="remember-row">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
            )}

            {!isLogin && (
              <label className="terms-row">
                <input type="checkbox" name="terms" required />

                <span>
                  I agree to the SNAPSMART{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() =>
                      setMessage(
                        "Terms and Conditions will be implemented before registration goes live.",
                      )
                    }
                  >
                    Terms &amp; Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() =>
                      setMessage(
                        "The Privacy Policy will be implemented before registration goes live.",
                      )
                    }
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
            )}

            <button className="primary-button" type="submit">
              {isLogin ? "Log In" : "Create Account"}
            </button>

            {message && (
              <div className="form-message" role="status">
                {message}
              </div>
            )}
          </form>

          {isLogin && (
            <div className="form-message" role="note">
              Mock Client Account: <strong>client@gmail.com</strong> /{" "}
              <strong>client</strong>
            </div>
          )}

          <div className="switch-prompt">
            <span>
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={() => navigate(isLogin ? "/signup" : "/login")}
            >
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </div>

          <p className="auth-note">
            Client access only. Administrative accounts are managed separately.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;