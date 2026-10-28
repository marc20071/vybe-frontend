"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { authApi } from "@/services/auth-api";

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingToken, setLoadingToken] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("access_token") || "";
    const type = hash.get("type");
    if (token && (!type || type === "recovery")) setAccessToken(token);
    else setError("This password reset link is invalid or has expired. Request a new one.");
    setLoadingToken(false);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirmPassword) { setError("Your passwords do not match."); return; }
    if (!accessToken) { setError("This reset link is invalid or has expired."); return; }
    setBusy(true);
    try { await authApi.resetPassword(accessToken, password); setSuccess(true); window.history.replaceState(null, "", window.location.pathname); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't reset your password. Request a new link."); }
    finally { setBusy(false); }
  }

  return <div className="form-card"><span className="heading-spark" style={{ marginBottom: 18 }}><ShieldCheck size={22}/></span><p className="eyebrow">ACCOUNT SECURITY</p><h1>Choose a new password.</h1>
    {loadingToken ? <p className="muted" role="status">Checking your reset link…</p> : success ? <><p className="notice" role="status">Your password has been updated. You can now sign in with your new password.</p><Link href="/login" className="button button-primary" style={{ width: "100%", marginTop: 18 }}>Go to sign in</Link></> : !accessToken ? <><p className="form-error" role="alert">{error}</p><Link href="/forgot-password" className="button button-primary" style={{ width: "100%" }}>Request a new reset link</Link></> : <form onSubmit={(event) => void submit(event)}><div className="form-field"><label htmlFor="password">New password</label><input id="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters"/></div><div className="form-field"><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again"/></div>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button button-primary" style={{ width: "100%" }} disabled={busy}>{busy && <LoaderCircle size={16} className="animate-spin"/>}{busy ? "Updating password…" : "Update password"}</button></form>}
    <p className="muted" style={{ fontSize: 13, marginTop: 20 }}><Link href="/login">← Back to sign in</Link></p>
  </div>;
}
