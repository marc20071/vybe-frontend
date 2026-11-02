
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    try {
      // Login now updates the global AuthContext immediately.
      await login({
        email: email.trim(),
        password,
      });

      const next = params.get("next") || "/";

      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Check your connection and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const next = params.get("next");

  return (
    <div className="form-card">
      <div className="brand" style={{ marginBottom: 26 }}>
        <BrandMark size={38} />
        <span>VYBE</span>
      </div>

      <p className="eyebrow">GOOD TO HAVE YOU BACK</p>

      <h1>Come on in.</h1>

      <p className="muted">
        Your people and your moments are waiting.
      </p>

      {params.get("confirmed") === "1" && (
        <p className="notice" role="status">
          Your email has been confirmed. Sign in to continue.
        </p>
      )}

      <form onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </div>

        <div style={{ textAlign: "right", fontSize: 12 }}>
          <Link href="/forgot-password" className="muted">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="button button-primary"
          style={{ width: "100%", marginTop: 18 }}
          disabled={busy}
        >
          {busy ? "Signing in..." : "Sign in to VYBE"}
        </button>
      </form>

      <p
        className="muted"
        style={{
          fontSize: 13,
          textAlign: "center",
          marginTop: 22,
        }}
      >
        New around here?{" "}
        <Link
          href={`/signup${
            next ? `?next=${encodeURIComponent(next)}` : ""
          }`}
          style={{
            color: "#c4b5fd",
            fontWeight: 700,
          }}
        >
          Create an account
        </Link>
      </p>

      <p className="footer-note">
        You can watch public content without signing in.
        An account is needed to participate.
      </p>
    </div>
  );
}
