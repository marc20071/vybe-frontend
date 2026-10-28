"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Film, Image as ImageIcon, LoaderCircle, UploadCloud, X } from "lucide-react";
import { uploadsApi } from "@/services/uploads-api";
import { postsApi } from "@/services/posts-api";
import { useAuth } from "@/hooks/useAuth";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading, requireAuth } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    setError(""); setStatus("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"].includes(next.type)) {
      setError("Choose a JPG, PNG, WebP, GIF, MP4, or WebM file."); return;
    }
    if (next.size > MAX_FILE_SIZE) { setError("The file must be 50 MB or smaller."); return; }
    setFile(next);
    setUploadedMediaId(null);
  }

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { requireAuth("/upload"); return; }
    if (!file || busy) return;
    setBusy(true); setProgress(0); setError(""); setStatus("");
    try {
      let mediaId = uploadedMediaId;
      if (!mediaId) {
        const uploaded = await uploadsApi.upload(file, { caption }, (percent) => setProgress(percent));
        mediaId = uploaded.mediaId;
        setUploadedMediaId(mediaId);
      } else {
        setProgress(100);
      }
      setStatus("Upload complete. Publishing your post…");
      const result = await postsApi.create({ caption: caption.trim(), mediaId, visibility: "public" });
      setStatus("Your post is live.");
      setFile(null);
      setUploadedMediaId(null);
      router.push(`/video/${result.post.id}`);
      router.refresh();
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Couldn't publish your post. Your upload may not have completed.");
    } finally { setBusy(false); }
  }

  if (authLoading) return <div className="page-wrap"><h1 className="page-title">Create a post</h1><div className="content-panel"><div className="skeleton skeleton-media" /><div className="skeleton skeleton-line" /></div></div>;
  if (!user) return <div className="page-wrap"><h1 className="page-title">Create a post</h1><section className="content-panel"><p>Sign in to upload photos and videos.</p><button type="button" className="button button-primary" onClick={() => requireAuth("/upload")}>Sign in to continue</button></section></div>;

  return (
    <div className="page-wrap upload-page">
      <p className="eyebrow">SHARE WITH YOUR PEOPLE</p>
      <h1 className="page-title">Create a post</h1>
      <p className="muted">Choose a photo or video, preview it, add a caption, and publish.</p>
      <form className="content-panel upload-form" style={{ marginTop: 22 }} onSubmit={publish}>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" hidden onChange={(event) => chooseFile(event.target.files?.[0])} />
        {previewUrl ? <div className="upload-preview">
          {file?.type.startsWith("video/") ? <video src={previewUrl} controls playsInline /> : <img src={previewUrl} alt="Selected post preview" />}
          <button type="button" className="icon-button upload-preview-remove" aria-label="Remove selected media" onClick={() => { setFile(null); setUploadedMediaId(null); }} disabled={busy}><X size={17} /></button>
        </div> : <button type="button" className="upload-drop" onClick={() => fileInput.current?.click()} disabled={busy}>
          <span className="upload-drop-icon"><UploadCloud size={32} /></span><strong>Choose a photo or video</strong><span className="muted">JPG, PNG, WebP, GIF, MP4, WebM · Up to 50 MB</span><span className="upload-file-types"><span><ImageIcon size={14} /> Photos</span><span><Film size={14} /> Videos</span></span>
        </button>}
        {file && <div className="upload-selected-row"><div><strong>{file.name}</strong><span className="muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</span></div><button type="button" className="button button-secondary" onClick={() => fileInput.current?.click()} disabled={busy}>Change file</button></div>}
        {busy && <div className="upload-progress" role="status" aria-live="polite"><div className="upload-progress-track"><span style={{ width: `${progress}%` }} /></div><span>{progress}% uploaded</span></div>}
        <div className="form-field"><label htmlFor="caption">Caption</label><textarea id="caption" rows={3} maxLength={2200} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What's happening?" disabled={busy} /><span className="footer-note" style={{ marginTop: 0, textAlign: "right" }}>{caption.length}/2200</span></div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {status && <p className="notice" role="status">{busy && <LoaderCircle size={15} className="animate-spin" />} {!busy && status === "Your post is live." && <CheckCircle2 size={15} />} {status}</p>}
        <button className="button button-primary" type="submit" disabled={!file || busy} style={{ width: "100%" }}>{busy ? <><LoaderCircle size={16} className="animate-spin" /> {progress < 100 ? `Uploading ${progress}%…` : "Publishing post…"}</> : "Publish post"}</button>
      </form>
    </div>
  );
}
