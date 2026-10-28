"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, MailCheck } from "lucide-react";
import { authApi } from "@/services/auth-api";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/hooks/useAuth";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authApi.signup({
        displayName: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.needsEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }
      await refreshUser();
      router.replace(params.get("next") || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    setResending(true);
    setResendNotice("");
    setError("");
    try {
      await authApi.resendConfirmation(email.trim().toLowerCase());
      setResendNotice("If the account needs confirmation, a new email has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the email. Try again shortly.");
    } finally {
      setResending(false);
    }
  }

  if (confirmationSent) {
    return (
      <section className="form-card" aria-labelledby="confirmation-title">
        <div className="brand" style={{ marginBottom: 26 }}><BrandMark size={38} /><span>VYBE</span></div>
        <div style={{ width: 58, height: 58, borderRadius: 18, display: "grid", placeItems: "center", background: "#a78bfa18", color: "#c4b5fd", marginBottom: 22 }}><MailCheck size={30} /></div>
        <p className="eyebrow">ONE LAST STEP</p>
        <h1 id="confirmation-title">Check your email.</h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          We sent a confirmation email to <strong style={{ color: "#fff", overflowWrap: "anywhere" }}>{email}</strong>. Confirm your email address before signing in to VYBE.
        </p>
        <div className="notice" style={{ marginTop: 20 }}>
          <CheckCircle2 size={17} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
          Open the email from VYBE and follow the confirmation link. If you don't see it, check your spam or junk folder.
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {resendNotice && <p className="notice" role="status">{resendNotice}</p>}
        <button className="button button-secondary" type="button" onClick={() => void resendConfirmation()} disabled={resending} style={{ width: "100%", marginTop: 18 }}>
          {resending && <LoaderCircle size={16} className="animate-spin" />}{resending ? "Sending…" : "Resend confirmation email"}
        </button>
        <p className="muted" style={{ fontSize: 13, textAlign: "center", marginTop: 22 }}>Already confirmed? <Link href={`/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} style={{ color: "#c4b5fd", fontWeight: 700 }}>Sign in</Link></p>
      </section>
    );
  }

  return (
    <div className="form-card">
      <div className="brand" style={{ marginBottom: 26 }}><BrandMark size={38} /><span>VYBE</span></div>
      <p className="eyebrow">YOUR PEOPLE ARE OUT THERE</p>
      <h1>Find your VYBE.</h1>
      <p className="muted">Make a little space for more of what you love.</p>
      <form onSubmit={submit}>
        <div className="form-field"><label htmlFor="name">Display name</label><input id="name" autoComplete="name" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="How people know you" /></div>
        <div className="form-field"><label htmlFor="username">Username</label><input id="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9._]+" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="your.handle" /><span className="footer-note">3–30 characters: letters, numbers, dots, and underscores.</span></div>
        <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
        <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary" style={{ width: "100%", marginTop: 8 }} disabled={busy}>{busy && <LoaderCircle size={16} className="animate-spin" />}{busy ? "Creating account…" : "Create your account"}</button>
      </form>
      <p className="muted" style={{ fontSize: 13, textAlign: "center", marginTop: 22 }}>Already have an account? <Link href={`/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} style={{ color: "#c4b5fd", fontWeight: 700 }}>Sign in</Link></p>
    </div>
  );
}
