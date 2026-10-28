import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() { return <Suspense fallback={<div className="form-card" role="status">Loading sign-in…</div>}><LoginForm /></Suspense>; }
