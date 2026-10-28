const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/$/, "");

export type UploadProgress = (percent: number, loaded: number, total: number) => void;
export type UploadResult = { mediaId: string; url?: string };

export const uploadsApi = {
  upload(file: File, metadata: { caption?: string } = {}, onProgress?: UploadProgress): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      if (metadata.caption) form.append("caption", metadata.caption);

      const request = new XMLHttpRequest();
      request.open("POST", `${API_BASE}/uploads`);
      request.withCredentials = true;
      request.setRequestHeader("Accept", "application/json");
      request.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)), event.loaded, event.total);
        }
      };
      request.onerror = () => reject(new Error("Network error while uploading. Check your connection and try again."));
      request.onabort = () => reject(new Error("Upload cancelled."));
      request.onload = () => {
        let body: any = null;
        try { body = JSON.parse(request.responseText); } catch { /* non-JSON server response */ }
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(body?.message || body?.error || `Upload failed (${request.status}).`));
          return;
        }
        if (!body?.mediaId) {
          reject(new Error("The upload completed but the server did not return a media ID."));
          return;
        }
        onProgress?.(100, file.size, file.size);
        resolve(body as UploadResult);
      };
      request.send(form);
    });
  },
};
