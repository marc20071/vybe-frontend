"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, LoaderCircle, Music2, Plus, Search, Type, UploadCloud, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { uploadsApi } from "@/services/uploads-api";
import { storiesApi, type Story, type MusicTrack } from "@/services/stories-api";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { Avatar } from "@/components/ui/Avatar";

type StoryGroup = { userId: string; username: string; displayName: string; avatarUrl?: string | null; stories: Story[] };
type StoryType = "text" | "image" | "video";
const MAX_MEDIA = 50 * 1024 * 1024;

export function StoryBar() {
  const { user, requireAuth } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mode, setMode] = useState<StoryType>("text");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [background, setBackground] = useState("linear-gradient(135deg,#4c1d95,#db2777)");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<MusicTrack[]>([]);
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [originalAudioMuted, setOriginalAudioMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [originalVolume, setOriginalVolume] = useState(1);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!pendingFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(pendingFile); setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try { const result = await storiesApi.list(); const now = Date.now(); setStories(result.items.filter((s) => new Date(s.expiresAt).getTime() > now)); setNotice(""); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Couldn't load stories."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadStories(); }, [loadStories]);

  const groups = useMemo<StoryGroup[]>(() => {
    const grouped = new Map<string, Story[]>();
    for (const story of stories) { const key = story.userId || story.username; grouped.set(key, [...(grouped.get(key) || []), story]); }
    return Array.from(grouped.values()).map((items) => ({ userId: items[0].userId, username: items[0].username, displayName: items[0].displayName || items[0].username, avatarUrl: items[0].avatarUrl, stories: items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) }));
  }, [stories]);
  const orderedStories = useMemo(() => groups.flatMap((g) => g.stories.map((s) => ({ ...s, username: g.username, displayName: g.displayName, avatarUrl: g.avatarUrl }))), [groups]);

  function openComposer() {
    if (!user) { requireAuth("/"); return; }
    setNotice(""); setComposerOpen(true); setMode("text");
  }
  function resetComposer() {
    setComposerOpen(false); setPendingFile(null); setPendingMediaId(null); setText(""); setMusic(null); setMusicResults([]); setMusicQuery(""); setMusicError(""); setOriginalAudioMuted(false); setMusicVolume(0.8); setOriginalVolume(1); setVisibility("public");
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current.src = ""; }
  }
  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!user) { requireAuth("/"); return; }
    const valid = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
    if (!valid.includes(file.type)) { setNotice("Choose a JPG, PNG, WebP, GIF, MP4, or WebM file."); return; }
    if (file.size > MAX_MEDIA) { setNotice("The file must be 50 MB or smaller."); return; }
    setMode(file.type.startsWith("video/") ? "video" : "image"); setPendingFile(file); setPendingMediaId(null); setNotice("");
  }
  async function searchMusic(event: React.FormEvent) {
    event.preventDefault(); if (musicQuery.trim().length < 2) { setMusicError("Enter at least two characters to search."); return; }
    setMusicLoading(true); setMusicError("");
    try { const result = await storiesApi.searchMusic(musicQuery.trim()); setMusicResults(result.items); if (!result.items.length) setMusicError("No licensed tracks found for that search."); }
    catch (error) { setMusicError(error instanceof Error ? error.message : "Music search failed."); }
    finally { setMusicLoading(false); }
  }
  function selectMusic(track: MusicTrack) {
    setMusic({ ...track, startSeconds: 0, durationSeconds: 15 }); setMusicError("");
    if (previewAudioRef.current) { previewAudioRef.current.src = track.audioUrl; previewAudioRef.current.volume = musicVolume; void previewAudioRef.current.play().catch(() => setMusicError("Tap the preview control to hear this track.")); }
  }
  async function publishStory() {
    if (uploading) return;
    if (mode === "text" && !text.trim()) { setNotice("Write something before publishing your text story."); return; }
    if (mode !== "text" && !pendingFile && !pendingMediaId) { setNotice("Choose a photo or video first."); return; }
    setUploading(true); setUploadProgress(0); setNotice("");
    try {
      let mediaId = pendingMediaId;
      if (mode !== "text" && pendingFile && !mediaId) { const result = await uploadsApi.upload(pendingFile, {}, (percent) => setUploadProgress(percent)); mediaId = result.mediaId; setPendingMediaId(mediaId); }
      const result = await storiesApi.create({ type: mode, ...(mediaId ? { mediaId } : {}), text: text.trim(), textStyle: { color: textColor, background }, visibility, music, originalAudioMuted, musicVolume, originalVolume });
      setStories((previous) => [result.story, ...previous]);
      setNotice("Your Story is live for 24 hours."); resetComposer();
      void loadStories();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Couldn't publish your Story. Please try again."); }
    finally { setUploading(false); setUploadProgress(0); }
  }
  function openGroup(group: StoryGroup) { const i = orderedStories.findIndex((story) => story.id === group.stories[0]?.id); if (i >= 0) setActiveIndex(i); }
  const isVideoPreview = mode === "video" && Boolean(previewUrl);

  return <section aria-label="Stories">
    <div className="story-row">
      <button type="button" className="story-item" style={{ border: 0, background: "none" }} onClick={openComposer}><span className="story-ring"><span className="story-avatar story-add"><Plus size={20}/></span></span><span>Add story</span></button>
      {groups.map((group) => <button key={group.userId} type="button" className="story-item" style={{ border: 0, background: "none" }} onClick={() => openGroup(group)} aria-label={`View ${group.username}'s stories`}><span className="story-ring"><span className="story-avatar" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}><Avatar name={group.displayName} src={group.avatarUrl} size={48}/></span></span><span>{group.username}</span></button>)}
      {loading && Array.from({ length: 4 }, (_, i) => <div className="story-item" key={`story-skeleton-${i}`} aria-hidden="true"><span className="story-ring"><span className="story-avatar story-avatar-skeleton"/></span><span className="skeleton story-label-skeleton"/></div>)}
      {!loading && groups.length === 0 && <span className="muted" style={{ alignSelf: "center", fontSize: 12 }}>No stories yet</span>}
    </div>
    {notice && !composerOpen && <p className="footer-note" role="status">{notice} <button type="button" onClick={() => void loadStories()} style={{ marginLeft: 8 }}>Refresh</button></p>}

    {composerOpen && <div className="story-composer-backdrop" role="dialog" aria-modal="true" aria-label="Create a Story"><div className="story-composer"><header><div><strong>Create a Story</strong><p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>Text, photos or videos — with optional music.</p></div><button type="button" className="icon-button" aria-label="Close editor" onClick={resetComposer} disabled={uploading}><X size={18}/></button></header>
      <div className="story-mode-tabs"><button type="button" className={mode === "text" ? "active" : ""} onClick={() => { setMode("text"); setPendingFile(null); setPendingMediaId(null); }}><Type size={15}/> Text</button><button type="button" className={mode === "image" ? "active" : ""} onClick={() => { setMode("image"); setPendingFile(null); setPendingMediaId(null); fileRef.current?.click(); }}><UploadCloud size={15}/> Photo</button><button type="button" className={mode === "video" ? "active" : ""} onClick={() => { setMode("video"); setPendingFile(null); setPendingMediaId(null); fileRef.current?.click(); }}><UploadCloud size={15}/> Video</button></div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" hidden onChange={chooseFile}/>
      <div className="story-editor-preview" style={mode === "text" ? { background, color: textColor } : undefined}>{mode === "text" ? <textarea aria-label="Story text" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to share?" style={{ color: textColor, background: "transparent" }}/> : previewUrl ? <>{isVideoPreview ? <video src={previewUrl} controls playsInline/> : <img src={previewUrl} alt="Story preview"/>}{text.trim() && <span className="story-text-overlay" style={{ color: textColor }}>{text}</span>}</> : <button type="button" className="button button-secondary" onClick={() => fileRef.current?.click()}><Plus size={16}/> Choose {mode === "video" ? "video" : "photo"}</button>}</div>
      {mode === "text" && <div className="story-style-row"><label>Text color <input aria-label="Text color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}/></label><label>Background <select value={background} onChange={(e) => setBackground(e.target.value)}><option value="linear-gradient(135deg,#4c1d95,#db2777)">Violet / pink</option><option value="linear-gradient(135deg,#0f766e,#164e63)">Ocean</option><option value="linear-gradient(135deg,#9a3412,#f59e0b)">Sunset</option><option value="#111116">Midnight</option><option value="linear-gradient(135deg,#1d4ed8,#7c3aed)">Blue / violet</option></select></label></div>}
      {mode !== "text" && <div className="form-field"><label htmlFor="story-overlay-text">Text or caption (optional)</label><textarea id="story-overlay-text" rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add words to your Story"/></div>}
      <div className="story-music-panel"><div className="story-music-title"><Music2 size={16}/><strong>Add music (optional)</strong>{music && <button type="button" className="button button-ghost" onClick={() => { setMusic(null); if (previewAudioRef.current) previewAudioRef.current.pause(); }}>Remove</button>}</div><form className="story-music-search" onSubmit={(e) => void searchMusic(e)}><input value={musicQuery} onChange={(e) => setMusicQuery(e.target.value)} placeholder="Search songs or artists" aria-label="Search music"/><button className="button button-secondary" type="submit" disabled={musicLoading}>{musicLoading ? <LoaderCircle size={15} className="animate-spin"/> : <Search size={15}/>} Search</button></form>{music && <p className="story-selected-track">Selected: <strong>{music.title}</strong> — {music.artist}{music.licenseUrl && <> · <a href={music.licenseUrl} target="_blank" rel="noreferrer">License details</a></>}</p>}{musicError && <p className="form-error" role="status">{musicError}</p>}<div className="story-music-results">{musicResults.map((track) => <div key={track.trackId} className="story-track"><span><strong>{track.title}</strong><small>{track.artist}</small></span><button type="button" className="button button-ghost" onClick={() => selectMusic(track)}>{music?.trackId === track.trackId ? "Selected" : "Preview / select"}</button></div>)}</div><audio ref={previewAudioRef} controls preload="none" style={{ width: "100%", marginTop: 8 }}/><p className="footer-note">Music playback depends on the selected catalog's license and the viewer's device audio settings.</p></div>
      {mode === "video" && <div className="story-audio-settings"><label><input type="checkbox" checked={originalAudioMuted} onChange={(e) => setOriginalAudioMuted(e.target.checked)}/> Mute original video audio</label><label>Music volume <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))}/></label><label>Original audio <input type="range" min="0" max="1" step="0.05" value={originalVolume} disabled={originalAudioMuted} onChange={(e) => setOriginalVolume(Number(e.target.value))}/></label></div>}
      <div className="form-field"><label htmlFor="story-visibility">Who can view this Story?</label><select id="story-visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}><option value="public">Everyone</option><option value="followers">Followers only</option><option value="private">Only me</option></select></div>
      {uploading && <div className="upload-progress" role="status"><div className="upload-progress-track"><span style={{ width: `${uploadProgress}%` }}/></div><span>{uploadProgress}%</span></div>}{notice && <p className="notice" role="alert">{notice}</p>}
      <div className="settings-button-row"><button type="button" className="button button-secondary" onClick={resetComposer} disabled={uploading}>Cancel</button><button type="button" className="button button-primary" onClick={() => void publishStory()} disabled={uploading}>{uploading ? <LoaderCircle size={16} className="animate-spin"/> : <Check size={16}/>} {uploading ? `Publishing ${uploadProgress}%` : "Share Story"}</button></div>
    </div></div>}
    {activeIndex !== null && orderedStories[activeIndex] && <StoryViewer stories={orderedStories} index={activeIndex} onIndexChange={setActiveIndex} onClose={() => setActiveIndex(null)} onChanged={() => void loadStories()}/>}
  </section>;
}
