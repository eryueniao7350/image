const DEFAULT_NEXT_PATH = "/studio";
const CALLBACK_PATH = "/auth/callback";
const LOGIN_PATH = "/login";
const FALLBACK_APP_ORIGIN = "http://localhost";

type LocationLike = {
  hash?: string;
  pathname?: string;
  search?: string;
};

function normalizeOrigin(origin: string | undefined): string | null {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export function getAppOrigin(): string {
  const browserOrigin =
    typeof window !== "undefined" ? normalizeOrigin(window.location.origin) : null;

  if (browserOrigin) {
    return browserOrigin;
  }

  const envOrigin = normalizeOrigin(import.meta.env.VITE_APP_URL);
  return envOrigin ?? FALLBACK_APP_ORIGIN;
}

export function sanitizeNextPath(nextPath = DEFAULT_NEXT_PATH): string {
  const trimmedPath = nextPath.trim();

  if (!trimmedPath || !trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const normalized = new URL(trimmedPath, getAppOrigin());
    return `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}

export function buildCurrentPath(location: LocationLike): string {
  return sanitizeNextPath(
    `${location.pathname ?? DEFAULT_NEXT_PATH}${location.search ?? ""}${location.hash ?? ""}`,
  );
}

export function buildLoginPath(nextPath = DEFAULT_NEXT_PATH): string {
  const params = new URLSearchParams({
    next: sanitizeNextPath(nextPath),
  });

  return `${LOGIN_PATH}?${params.toString()}`;
}

export function buildAuthCallbackUrl(nextPath = DEFAULT_NEXT_PATH): string {
  const callbackUrl = new URL(CALLBACK_PATH, getAppOrigin());
  callbackUrl.searchParams.set("next", sanitizeNextPath(nextPath));
  return callbackUrl.toString();
}
