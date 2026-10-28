import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
export const metadata: Metadata = { title: "Create account" };
export default function SignupPage() { return <Suspense fallback={<div className="form-card" role="status">Loading account creation…</div>}><SignupForm /></Suspense>; }
