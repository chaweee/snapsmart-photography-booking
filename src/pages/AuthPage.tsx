import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { supabase } from "../lib/supabase";

const capitalizeName = (value: string) => value.replace(/(^|[\s'-])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase());

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname !== "/signup";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!signupComplete) return;
    const timer = window.setTimeout(() => navigate("/", { replace: true }), 2000);
    return () => window.clearTimeout(timer);
  }, [signupComplete, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (!isLogin && !/^\d{11}$/.test(phone)) {
      setMessage("Phone number must contain exactly 11 digits.");
      return;
    }
    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      setMessage("Please enter your first and last name.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("");
    setSubmitting(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        if (profileError || !profile) {
          setMessage("Your profile could not be loaded. Please contact the administrator.");
          return;
        }
        navigate(profile.role === "admin" ? "/admin" : profile.role === "client" ? "/" : "/photographer");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: `${firstName.trim()} ${lastName.trim()}`, phone }, emailRedirectTo: `${window.location.origin}/login` },
        });
        if (error) throw error;
        if (data.session) {
          setSignupComplete(true);
          setMessage("Signed up successfully! Your account is ready.");
        } else if (data.user && data.user.identities?.length !== 0) {
          setSignupComplete(true);
          setMessage("Signed up successfully! Please check your email to confirm your account before logging in.");
        } else {
          setMessage("If this email can be registered, check your inbox for a confirmation link. If it is already registered, try logging in instead.");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
                ? "Access your bookings, receipts, payments, and galleries."
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

          {signupComplete ? <div className="form-message" role="status">{message}<br />Redirecting to home...</div> : <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="auth-name-row">
                <div className="field-group">
                  <label htmlFor="firstName">First Name</label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    value={firstName}
                    onChange={(event) => setFirstName(capitalizeName(event.target.value))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    autoComplete="family-name"
                    autoCapitalize="words"
                    value={lastName}
                    onChange={(event) => setLastName(capitalizeName(event.target.value))}
                    required
                  />
                </div>

                </div>

                <div className="field-group">
                  <label htmlFor="phone">Phone Number</label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="09XX XXX XXXX"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    minLength={11}
                    maxLength={11}
                    title="Enter exactly 11 digits"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
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
                  placeholder="Enter your password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
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

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : isLogin ? "Log In" : "Create Account"}
            </button>

            {message && (
              <div className="form-message" role="status">
                {message}
              </div>
            )}
          </form>}

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

        </div>
      </section>
    </main>
  );
}

export default AuthPage;
