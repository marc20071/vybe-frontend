const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://vybe-backend-0pu1.onrender.com/api"
    : "http://localhost:4000/api")
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  json?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { json, ...init } = options;
  const headers = new Headers(init.headers);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";

  const body: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    let message: string | undefined;

    if (typeof body === "object" && body !== null) {
      const errorBody = body as {
        message?: string;
        error?: string | { message?: string };
      };

      message =
        errorBody.message ||
        (typeof errorBody.error === "string"
          ? errorBody.error
          : errorBody.error?.message);
    }

    throw new ApiError(
      message || `Request failed (${response.status})`,
      response.status
    );
  }

  return body as T;
}