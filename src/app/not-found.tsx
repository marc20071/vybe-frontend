import Link from "next/link";
export default function NotFound(){return <div className="content-panel" style={{textAlign:"center",marginTop:50}}><p className="eyebrow">404 · LOST THE VYBE?</p><h1 className="page-title">This moment isn’t here.</h1><p className="muted">The page may have moved or the link may be old.</p><Link href="/" className="button button-primary">Back to your feed</Link></div>}
