import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { IMAGE_APP_NAME, IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  buildAuthCallbackUrl,
  buildLoginPath,
  sanitizeNextPath,
} from "../utils/routeIntents";

export function LoginPage() {
  const { user, loading, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next") ?? IMAGE_ROUTE_PATHS.studio),
    [searchParams],
  );
  const callbackUrl = useMemo(() => buildAuthCallbackUrl(nextPath), [nextPath]);
  const authUnavailable = !isSupabaseConfigured;

  useEffect(() => {
    if (!loading && user) {
      navigate(nextPath, { replace: true });
    }
  }, [loading, navigate, nextPath, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (authUnavailable) {
      setError("Magic-link sign-in is unavailable because Supabase is not configured in this environment.");
      return;
    }

    setSubmitting(true);

    try {
      await signInWithMagicLink(email, nextPath);
      setSuccess(`Magic link sent to ${email}. Open the email on this device to continue.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send magic link.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="image-shell image-shell--narrow">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">Sign in</span>
        <h1 className="image-title">Use a magic link to open {IMAGE_APP_NAME}.</h1>
        <p className="image-muted">
          We will email a secure sign-in link and return you to <code>{nextPath}</code>.
        </p>
        {authUnavailable ? (
          <p className="image-alert image-alert--error">
            Sign-in is unavailable in this environment until Supabase credentials are configured.
          </p>
        ) : null}

        <form className="image-form" onSubmit={handleSubmit}>
          <label className="image-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="image-input"
            placeholder="you@company.com"
            disabled={authUnavailable}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error ? <p className="image-alert image-alert--error">{error}</p> : null}
          {success ? <p className="image-alert image-alert--success">{success}</p> : null}

          <button
            className="image-button image-button--primary"
            disabled={submitting || authUnavailable}
            type="submit"
          >
            {authUnavailable ? "Magic link unavailable" : submitting ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        <div className="image-note">
          <strong>Callback URL</strong>
          <code>{callbackUrl}</code>
        </div>

        <p className="image-muted">
          Need context first? <Link to={buildLoginPath(IMAGE_ROUTE_PATHS.history)}>Try the history route</Link> or{" "}
          <Link to={IMAGE_ROUTE_PATHS.pricing}>review pricing</Link>. You can also visit the{" "}
          <Link to={IMAGE_ROUTE_PATHS.hub}>legacy hub</Link>.
        </p>
      </section>
    </main>
  );
}
