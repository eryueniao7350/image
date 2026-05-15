import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { GenerationHistoryRecord } from "../features/imageStudio/api";
import { HistoryList } from "../features/imageStudio/components/HistoryList";
import { StudioShell } from "../features/imageStudio/components/StudioShell";
import { IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";
import { useGenerationHistory } from "../features/imageStudio/hooks/useGenerationHistory";
import { useProfile } from "../features/imageStudio/hooks/useProfile";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function HistoryPage() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const { history, loading, error, reload } = useGenerationHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected: GenerationHistoryRecord | null =
    history.find((entry) => entry.id === selectedId) ?? history[0] ?? null;

  const loadError = error?.message ?? profileError?.message ?? null;

  return (
    <StudioShell
      credits={profile?.credits}
      creditsLoading={profileLoading}
      email={profile?.email ?? user?.email ?? null}
      onSignOut={signOut}
      profileStatus={
        loadError ? (
          <div className="image-alert image-alert--error">{loadError}</div>
        ) : null
      }
    >
      <HistoryList
        entries={history}
        loading={loading}
        onSelect={(entry) => setSelectedId(entry.id)}
        onReload={reload}
        selectedId={selected?.id ?? null}
      />

      <section className="image-panel">
        <div className="image-panel__header">
          <span>Selected run</span>
          <span>{selected ? formatDateTime(selected.createdAt) : "Pick a generation"}</span>
        </div>

        {selected ? (
          <div className="image-tag-grid" style={{ marginTop: "18px" }}>
            {selected.imageUrl ? (
              <figure
                className="image-sample-card"
                style={{ margin: 0, overflow: "hidden", padding: 0, background: "#e2e8f0" }}
              >
                <img
                  alt={selected.subjectText}
                  src={selected.imageUrl}
                  style={{ display: "block", width: "100%", height: "auto", objectFit: "cover" }}
                />
              </figure>
            ) : (
              <div className="image-tag-card">
                <strong>No saved preview</strong>
                <p>
                  This run is marked as <strong>{selected.status}</strong>, so there is no stored
                  image to review yet.
                </p>
              </div>
            )}

            <div className="image-note">
              <strong>Subject summary</strong>
              <span>{selected.subjectText}</span>
            </div>

            <div className="image-note">
              <strong>Final prompt</strong>
              <span>{selected.finalPrompt ?? "No final prompt was saved for this run."}</span>
            </div>

            <div
              className="image-tag-grid"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
            >
              <div className="image-tag-card">
                <strong>Image type</strong>
                <p>{titleCase(selected.imageType)}</p>
              </div>
              <div className="image-tag-card">
                <strong>Style</strong>
                <p>{titleCase(selected.style)}</p>
              </div>
              <div className="image-tag-card">
                <strong>Aspect ratio</strong>
                <p>{selected.aspectRatio}</p>
              </div>
              <div className="image-tag-card">
                <strong>Credit cost</strong>
                <p>{selected.creditCost}</p>
              </div>
              <div className="image-tag-card">
                <strong>Status</strong>
                <p>{titleCase(selected.status)}</p>
              </div>
            </div>

            <div className="image-note">
              <strong>Scene</strong>
              <span>{selected.scene}</span>
            </div>

            <div className="image-note">
              <strong>Whitespace guidance</strong>
              <span>{selected.whitespace}</span>
            </div>

            <div className="image-note">
              <strong>Extra requirements</strong>
              <span>{selected.extraRequirements || "No extra requirements were added."}</span>
            </div>
          </div>
        ) : (
          <div className="image-tag-grid" style={{ marginTop: "18px" }}>
            <div className="image-tag-card">
              <strong>No generation selected</strong>
              <p>
                Start a new image in the studio, or choose one from the list once your history loads.
              </p>
            </div>
            <div className="image-hero__actions" style={{ marginTop: 0 }}>
              <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.studio}>
                Open studio
              </Link>
              <button className="image-button image-button--secondary" onClick={() => void reload()} type="button">
                Reload history
              </button>
            </div>
          </div>
        )}
      </section>
    </StudioShell>
  );
}
