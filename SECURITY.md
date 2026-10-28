# Frontend security notes

- Never place backend service-role keys, private API secrets, or signing secrets in `NEXT_PUBLIC_*` variables.
- Frontend authentication checks are for user experience only. The backend must authorize every protected request.
- Public feed endpoints must return only public, permitted content. Do not send private media URLs and rely on the UI to hide them.
- Use HTTPS in production and configure CORS to allow only approved frontend origins.
- Validate file type, size, ownership, and upload authorization on the backend; browser checks are not a security boundary.
- Treat message content, profile data, captions, and uploaded media as untrusted input.
- Apply server-side rate limits and abuse prevention for login, signup, comments, messaging, search, and uploads.
- Use secure, HttpOnly, SameSite cookies where the backend's authentication design supports them. Avoid storing long-lived credentials in localStorage.
- Publish clear privacy, retention, deletion, reporting, and moderation policies before launch.
