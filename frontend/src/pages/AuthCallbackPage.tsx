import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";
import { sanitizeNextPath } from "../utils/routeIntents";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const destination = sanitizeNextPath(
      searchParams.get("next") ?? IMAGE_ROUTE_PATHS.studio,
    );
    navigate(destination, { replace: true });
  }, [navigate, searchParams]);

  return (
    <main className="image-shell image-shell--narrow">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">Signing you in</span>
        <h1 className="image-title">Redirecting to your workspace...</h1>
        <p className="image-muted">If nothing happens, the next route will load automatically.</p>
      </section>
    </main>
  );
}
