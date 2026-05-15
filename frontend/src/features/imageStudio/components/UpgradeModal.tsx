import { Link } from "react-router-dom";
import { IMAGE_ROUTE_PATHS } from "../constants";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby="upgrade-modal-title"
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: "20px",
        background: "rgba(15, 23, 42, 0.42)",
      }}
    >
      <section className="image-panel image-panel--stacked" style={{ width: "min(560px, 100%)" }}>
        <span className="image-eyebrow">Credits needed</span>
        <h2 className="image-title" id="upgrade-modal-title">
          You&apos;re out of generation credits.
        </h2>
        <p className="image-muted">
          This MVP keeps the upgrade path lightweight for now, but we still need to block new
          generations once your balance reaches zero.
        </p>

        <div className="image-hero__actions">
          <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.pricing}>
            Review pricing
          </Link>
          <button className="image-button image-button--secondary" onClick={onClose} type="button">
            Keep browsing
          </button>
        </div>
      </section>
    </div>
  );
}
