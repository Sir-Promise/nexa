"use client";

import { useState } from "react"; import { supabase } from "../lib/supabase";

type AuthMode = "welcome" | "signin" | "signup";

export default function Home() { const [mode, setMode] = useState<AuthMode>("welcome"); const [doorsOpen, setDoorsOpen] = useState(false); const [preview, setPreview] = useState(false);

const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");

function openDoors() { setDoorsOpen(true); setPreview(true);

setTimeout(() => {
  setDoorsOpen(false);
  setPreview(false);
}, 3500);


}

async function handleAuthentication( e: React.FormEvent<HTMLFormElement> ) { e.preventDefault();

setLoading(true);
setMessage("");
setError("");

try {
  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000",
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.session) {
      setMessage(
        "Welcome to NEXA! Your account has been created."
      );
    } else {
      setMessage(
        "Registration successful! Please check your email and click the confirmation link to activate your account."
      );
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Redirect successfully authenticated users
    window.location.href = "/dashboard";
    return;
  }
} catch (err: unknown) {
  setError(
    err instanceof Error
      ? err.message
      : "Something went wrong. Please try again."
  );
} finally {
  setLoading(false);
}


}

return ( <main className="galaxy"> <div className="stars stars-one" /> <div className="stars stars-two" /> <div className="nebula nebula-one" /> <div className="nebula nebula-two" /> <div className="galaxy-glow" />

  <header className="galaxy-header">
    <div className="nexa-logo">
      <span className="logo-icon">N</span>
      <span>NEXA</span>
    </div>

    <span className="header-caption">
      CONNECT · LEARN · DISCOVER
    </span>
  </header>

  <section className="entrance">
    <div className="welcome-text">
      <span className="welcome-tag">
        ✦ YOUR WORLD BEGINS HERE ✦
      </span>

      <h1>
        Explore a universe
        <br />
        <span>of possibilities.</span>
      </h1>

      <p>
        Connect with people, discover knowledge,
        share experiences and explore a world
        without limits.
      </p>
    </div>

    <div className={`door-frame ${doorsOpen ? "doors-open" : ""}`}>
      <div className="door-light" />

      <div className="door door-left">
        <div className="door-design">
          <div className="door-inner">
            <span>✦</span>
            <div className="door-line" />
            <small>N</small>
          </div>
        </div>
        <div className="door-handle" />
      </div>

      <div className="door door-right">
        <div className="door-design">
          <div className="door-inner">
            <span>✦</span>
            <div className="door-line" />
            <small>N</small>
          </div>
        </div>
        <div className="door-handle" />
      </div>

      <div className="door-center">
        <span>WELCOME TO</span>
        <strong>NEXA</strong>
        <small>YOUR UNIVERSE</small>
      </div>
    </div>

    <div className="entry-actions">
      {mode === "welcome" && (
        <>
          <button
            className="primary-button"
            onClick={() => {
              setMode("signin");
              setError("");
              setMessage("");
            }}
          >
            Sign In <span>→</span>
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
          >
            Create Account
          </button>

          <button
            className="preview-button"
            onClick={openDoors}
          >
            ✧ Preview the opening experience
          </button>
        </>
      )}

      {mode !== "welcome" && (
        <div className="auth-panel">
          <button
            className="back-button"
            onClick={() => {
              setMode("welcome");
              setError("");
              setMessage("");
            }}
          >
            ← Back
          </button>

          <h2>
            {mode === "signin"
              ? "Welcome back"
              : "Join Nexa"}
          </h2>

          <p>
            {mode === "signin"
              ? "Enter your details to access your universe."
              : "Create your place in the Nexa community."}
          </p>

          <form onSubmit={handleAuthentication}>
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {mode === "signup" && (
              <label className="terms">
                <input type="checkbox" required />
                I agree to Nexa's Terms and Privacy Policy.
              </label>
            )}

            {error && (
              <div className="preview-message">
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className="preview-message">
                ✨ {message}
              </div>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}

              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="switch-auth">
            {mode === "signin" ? (
              <>
                New to Nexa?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setMessage("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {preview && (
        <div className="preview-message">
          ✨ The doors are opening. Welcome to Nexa!
        </div>
      )}
    </div>
  </section>

  <footer className="galaxy-footer">
    <span>© 2026 NEXA</span>
    <span>ONE UNIVERSE. ENDLESS POSSIBILITIES.</span>
    <span>BUILT FOR EVERY CURIOUS MIND ✦</span>
  </footer>
</main>


); }