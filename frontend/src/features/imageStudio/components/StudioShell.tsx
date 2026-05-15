import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { IMAGE_APP_NAME, IMAGE_ROUTE_PATHS } from "../constants";
import { CreditBadge } from "./CreditBadge";

interface StudioShellProps {
  children: ReactNode;
  credits?: number;
  creditsLoading?: boolean;
  email?: string | null;
  onSignOut: () => Promise<void> | void;
  profileStatus?: ReactNode;
}

export function StudioShell({
  children,
  credits,
  creditsLoading = false,
  email,
  onSignOut,
  profileStatus,
}: StudioShellProps) {
  return (
    <main className="image-shell">
      <section
        className="image-hero"
        style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(320px, 1.1fr)", alignItems: "start" }}
      >
        <div className="image-hero__copy">
          <span className="image-eyebrow">Protected studio</span>
          <h1>{IMAGE_APP_NAME} is ready for live image generation.</h1>
          <p>
            Signed-in creators can spend credits here, generate production-ready images through the
            edge function, and keep the latest output visible without waiting for the history page.
          </p>
          <div className="image-hero__actions">
            <CreditBadge credits={credits} loading={creditsLoading} />
          </div>
          {profileStatus ? <div style={{ marginTop: "18px" }}>{profileStatus}</div> : null}
          <ul className="image-checklist">
            <li>Magic-link auth is already protecting this route.</li>
            <li>Each successful generation updates your local remaining credit count.</li>
            <li>Low-credit attempts route you to the upgrade modal instead of the backend call.</li>
          </ul>
        </div>

        <aside className="image-panel">
          <div className="image-panel__header">
            <span>Session</span>
            <button className="image-button image-button--secondary" onClick={() => void onSignOut()} type="button">
              Sign out
            </button>
          </div>
          <div className="image-tag-grid">
            <div className="image-tag-card">
              <strong>Signed in as</strong>
              <p>{email ?? "Unknown user"}</p>
            </div>
            <div className="image-tag-card">
              <strong>Need pricing context?</strong>
              <p>
                The upgrade path is still intentionally lightweight, but the route is ready when
                the balance hits zero.
              </p>
            </div>
            <div className="image-hero__actions" style={{ marginTop: 0 }}>
              <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.pricing}>
                Pricing route
              </Link>
              <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.hub}>
                Legacy hub
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="image-grid" style={{ gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)" }}>
        {children}
      </section>
    </main>
  );
}
