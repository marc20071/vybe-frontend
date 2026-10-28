import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="page-wrap" style={{ maxWidth: 620, margin: "12vh auto", textAlign: "center" }}>
      <div aria-hidden="true" style={{ fontSize: 44, marginBottom: 18 }}>✦</div>
      <p className="eyebrow">YOU ARE OFFLINE</p>
      <h1 className="page-title">Your VYBE will be here when you reconnect.</h1>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        Connect to the internet and try again. For your privacy, account pages and messages are not stored for offline use.
      </p>
      <Link href="/" className="button button-primary" style={{ marginTop: 18 }}>Try again</Link>
    </main>
  );
}
