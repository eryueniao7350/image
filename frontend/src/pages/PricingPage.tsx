import { Link } from "react-router-dom";
import { IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";

export function PricingPage() {
  return (
    <main className="image-shell">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">Pricing</span>
        <h1 className="image-title">Pricing is not finalized for this MVP yet.</h1>
        <p className="image-muted">
          This placeholder keeps the route live for the current image flow without making promises
          about tiers, limits, or packaging before the studio experience is ready.
        </p>

        <div className="image-hero__actions">
          <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.login}>
            Continue to sign in
          </Link>
          <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.home}>
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
