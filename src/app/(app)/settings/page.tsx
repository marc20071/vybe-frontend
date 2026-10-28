"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, LoaderCircle, Save, Trash2, UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/services/users-api";
import { uploadsApi } from "@/services/uploads-api";

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [uploadedAvatarMediaId, setUploadedAvatarMediaId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<{ userId: string; username: string; displayName: string; avatarUrl?: string | null; blockedAt: string }[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [messagePrivacy, setMessagePrivacy] = useState<"everyone" | "followers" | "nobody">("everyone");
  const [privacySaving, setPrivacySaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    usersApi.preferences().then((prefs) => { setIsPrivate(prefs.isPrivate); setMessagePrivacy(prefs.messagePrivacy); }).catch(() => setError("Could not load privacy preferences."));
    setBlocksLoading(true);
    usersApi.blockedUsers().then((result) => setBlockedUsers(result.items)).catch(() => setError("Couldn't load your blocked accounts.")).finally(() => setBlocksLoading(false));
  }, [user?.id]);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setBio(user?.bio ?? "");
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user]);

  useEffect(() => {
    if (!selectedAvatar) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedAvatar);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedAvatar]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setNotice(""); setError("");
    try {
      await usersApi.updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
      await refreshUser();
      setNotice("Profile changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally { setSaving(false); }
  }

  function chooseAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Your profile image must be 5 MB or smaller."); return;
    }
    setSelectedAvatar(file);
    setUploadedAvatarMediaId(null);
  }

  async function uploadAvatar() {
    if (!selectedAvatar || uploading) return;
    setUploading(true); setUploadProgress(0); setError(""); setNotice("");
    try {
      let mediaId = uploadedAvatarMediaId;
      if (!mediaId) {
        const uploaded = await uploadsApi.upload(selectedAvatar, {}, (percent) => setUploadProgress(percent));
        mediaId = uploaded.mediaId;
        setUploadedAvatarMediaId(mediaId);
      } else {
        setUploadProgress(100);
      }
      const result = await usersApi.updateProfile({ avatarMediaId: mediaId });
      setAvatarUrl(result.user.avatarUrl ?? null);
      setSelectedAvatar(null);
      setUploadedAvatarMediaId(null);
      await refreshUser();
      setNotice("Profile photo updated. It will appear across VYBE.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update your profile photo.");
    } finally { setUploading(false); setUploadProgress(0); }
  }

  async function removeAvatar() {
    if (removingAvatar || uploading) return;
    setRemovingAvatar(true); setError(""); setNotice("");
    try {
      await usersApi.updateProfile({ avatarUrl: null });
      setAvatarUrl(null); setSelectedAvatar(null); setUploadedAvatarMediaId(null);
      await refreshUser();
      setNotice("Profile photo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove your profile photo.");
    } finally { setRemovingAvatar(false); }
  }

  if (authLoading) {
    return <div className="page-wrap"><h1 className="page-title">Settings</h1><section className="content-panel" role="status"><p>Loading your account settings…</p><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></section></div>;
  }
  if (!user) {
    return <div className="page-wrap"><h1 className="page-title">Settings</h1><section className="content-panel"><p>Sign in to manage your profile and account settings.</p><a href="/login" className="button button-primary">Sign in</a></section></div>;
  }

  return (
    <div className="page-wrap settings-page">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1 className="page-title">Settings</h1>
      <p className="muted">Manage how people see you on VYBE.</p>

      <form onSubmit={saveProfile}>
        <section className="content-panel settings-panel" style={{ marginTop: 22 }}>
          <h2>Profile information</h2>
          <div className="settings-avatar-row">
            <div className="settings-avatar-preview">
              {previewUrl || avatarUrl ? <img src={previewUrl || avatarUrl || ""} alt="Profile photo preview" /> : <UserRound size={34} />}
            </div>
            <div className="settings-avatar-actions">
              <strong>@{user.username}</strong>
              <p className="muted" style={{ fontSize: 12 }}>JPG, PNG, or WebP · Up to 5 MB</p>
              <div className="settings-button-row">
                <button type="button" className="button button-secondary" onClick={() => fileRef.current?.click()} disabled={uploading || removingAvatar}><Camera size={15} /> Choose photo</button>
                {(avatarUrl || previewUrl) && <button type="button" className="button button-secondary" onClick={() => void removeAvatar()} disabled={uploading || removingAvatar}><Trash2 size={15} /> Remove</button>}
              </div>
              {selectedAvatar && <p className="muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>Selected: {selectedAvatar.name}</p>}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={chooseAvatar} />

          {selectedAvatar && <div className="selected-avatar-actions">
            <button type="button" className="button button-primary" onClick={() => void uploadAvatar()} disabled={uploading}><ImagePlus size={16} /> {uploading ? `Uploading ${uploadProgress}%` : "Upload and save photo"}</button>
            <button type="button" className="button button-secondary" onClick={() => { setSelectedAvatar(null); setUploadedAvatarMediaId(null); }} disabled={uploading}>Cancel</button>
          </div>}
          {uploading && <div className="upload-progress" role="status" aria-live="polite"><div className="upload-progress-track"><span style={{ width: `${uploadProgress}%` }} /></div><span>{uploadProgress}% uploaded</span></div>}
          {removingAvatar && <p className="muted" role="status"><LoaderCircle size={14} className="animate-spin" /> Removing photo…</p>}

          <div className="form-field"><label htmlFor="displayName">Display name</label><input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} autoComplete="name" required /></div>
          <div className="form-field"><label htmlFor="bio">Bio</label><textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} rows={4} placeholder="A little about you…" /><span className="footer-note" style={{ marginTop: 0, textAlign: "right" }}>{bio.length}/300</span></div>
          <button className="button button-primary" type="submit" disabled={saving || uploading}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving changes…" : "Save profile"}</button>
        </section>
      </form>

      <section className="content-panel settings-panel" style={{ marginTop: 16 }}>
        <h2>Privacy and messages</h2>
        <p className="muted" style={{ fontSize: 12 }}>Control who can see your account and start a conversation with you.</p>
        <div className="settings-row"><div><strong>Private account</strong><p className="muted" style={{ fontSize: 12 }}>When enabled, people need approval before following you. Public posts remain discoverable when this is off.</p></div><label className="privacy-switch"><input type="checkbox" checked={isPrivate} disabled={privacySaving} onChange={async (e) => { const next = e.target.checked; setPrivacySaving(true); setError(""); try { const saved = await usersApi.updatePreferences({ isPrivate: next }); setIsPrivate(saved.isPrivate); setNotice("Privacy settings saved."); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update privacy settings."); } finally { setPrivacySaving(false); } }} /><span>{isPrivate ? "Private" : "Public"}</span></label></div>
        <div className="form-field"><label htmlFor="messagePrivacy">Who can send you messages?</label><select id="messagePrivacy" value={messagePrivacy} disabled={privacySaving} onChange={async (e) => { const next = e.target.value as "everyone" | "followers" | "nobody"; setPrivacySaving(true); setError(""); try { const saved = await usersApi.updatePreferences({ messagePrivacy: next }); setMessagePrivacy(saved.messagePrivacy); setNotice("Message preferences saved."); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update message preferences."); } finally { setPrivacySaving(false); } }}><option value="everyone">Everyone</option><option value="followers">People I follow / my followers</option><option value="nobody">Nobody (except existing conversations)</option></select></div>
        {privacySaving && <p className="muted" role="status"><LoaderCircle size={14} className="animate-spin" /> Saving privacy settings…</p>}
      </section>

      {(notice || error) && <p role={error ? "alert" : "status"} className={error ? "form-error" : "notice"} style={{ marginTop: 14 }}>{error || <><Check size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />{notice}</>}</p>}

      <section className="content-panel settings-panel" style={{ marginTop: 16 }}>
        <h2>Blocked accounts</h2>
        <p className="muted" style={{ fontSize: 12 }}>Blocked accounts cannot follow or message you through VYBE. Blocking also removes follow relationships in both directions.</p>
        {blocksLoading ? <p className="muted" role="status">Loading blocked accounts…</p> : blockedUsers.length === 0 ? <p className="muted">You have not blocked anyone.</p> : blockedUsers.map((blocked) => <div className="settings-row" key={blocked.userId}><div><strong>{blocked.displayName}</strong><p className="muted" style={{ fontSize: 12 }}>@{blocked.username}</p></div><button type="button" className="button button-secondary" disabled={unblocking === blocked.username} onClick={async () => { setUnblocking(blocked.username); setError(""); try { await usersApi.unblockUser(blocked.username); setBlockedUsers((items) => items.filter((item) => item.username !== blocked.username)); setNotice(`@${blocked.username} was unblocked.`); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't unblock this account."); } finally { setUnblocking(null); } }}>{unblocking === blocked.username ? <LoaderCircle size={15} className="animate-spin"/> : <ShieldCheck size={15}/>} Unblock</button></div>)}
      </section>

      <section className="content-panel settings-panel" style={{ marginTop: 16 }}>
        <h2>Account</h2>
        <div className="settings-row"><div><strong>Username</strong><p className="muted" style={{ fontSize: 12 }}>@{user.username}</p></div></div>
        <div className="settings-row"><div><strong>Email address</strong><p className="muted" style={{ fontSize: 12 }}>{user.email || "Your registered email"}</p></div></div>
        <div className="settings-row"><div><strong>Sign-in and security</strong><p className="muted" style={{ fontSize: 12 }}>Use password recovery if you need to reset your password.</p></div><a className="button button-secondary" href="/forgot-password">Reset password</a></div>
      </section>
    </div>
  );
}
