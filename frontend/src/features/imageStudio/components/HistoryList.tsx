import type { GenerationHistoryRecord } from "../api";

interface HistoryListProps {
  entries: GenerationHistoryRecord[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect: (entry: GenerationHistoryRecord) => void;
  onReload?: () => void | Promise<void>;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

function truncateSummary(value: string, maxLength = 84) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function statusLabel(status: GenerationHistoryRecord["status"]) {
  if (status === "succeeded") {
    return "Ready";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Processing";
}

function statusTone(status: GenerationHistoryRecord["status"]) {
  if (status === "succeeded") {
    return "#166534";
  }

  if (status === "failed") {
    return "#991b1b";
  }

  return "#92400e";
}

export function HistoryList({
  entries,
  loading = false,
  selectedId = null,
  onSelect,
  onReload,
}: HistoryListProps) {
  return (
    <section className="image-panel">
      <div className="image-panel__header">
        <span>Generation history</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{loading ? "Loading..." : `${entries.length} recent runs`}</span>
          {onReload ? (
            <button
              className="image-button image-button--secondary"
              onClick={() => void onReload()}
              style={{ padding: "8px 14px" }}
              type="button"
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      <p className="image-muted">
        Review recent generations, compare prompts, and reopen the full output details without
        changing anything yet.
      </p>

      {loading ? (
        <div className="image-tag-grid" style={{ marginTop: "18px" }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="image-tag-card" key={index}>
              <strong>Loading generation...</strong>
              <p>Pulling your most recent image requests and saved prompts.</p>
            </div>
          ))}
        </div>
      ) : entries.length ? (
        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
            maxHeight: "920px",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {entries.map((entry) => {
            const isSelected = entry.id === selectedId;

            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "96px minmax(0, 1fr)",
                  gap: "14px",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px",
                  borderRadius: "20px",
                  border: isSelected ? "1px solid rgba(15, 23, 42, 0.24)" : "1px solid rgba(148, 163, 184, 0.24)",
                  background: isSelected ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.72)",
                  boxShadow: isSelected ? "0 14px 30px rgba(15, 23, 42, 0.12)" : "none",
                  cursor: "pointer",
                }}
                type="button"
              >
                {entry.imageUrl ? (
                  <img
                    alt={entry.subjectText}
                    src={entry.imageUrl}
                    style={{
                      width: "96px",
                      height: "96px",
                      objectFit: "cover",
                      borderRadius: "16px",
                      background: "#e2e8f0",
                    }}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    style={{
                      width: "96px",
                      height: "96px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                      display: "grid",
                      placeItems: "center",
                      color: "#334155",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {entry.status}
                  </div>
                )}

                <div style={{ minWidth: 0, display: "grid", gap: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ fontSize: "15px", lineHeight: 1.35 }}>
                      {truncateSummary(entry.subjectText)}
                    </strong>
                    <span
                      style={{
                        color: statusTone(entry.status),
                        background: "rgba(255, 255, 255, 0.85)",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {statusLabel(entry.status)}
                    </span>
                  </div>

                  <p style={{ margin: 0, color: "#475569", fontSize: "13px", lineHeight: 1.45 }}>
                    {formatDateTime(entry.createdAt)}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {[entry.imageType, entry.style, entry.aspectRatio, `${entry.creditCost} credit`].map((item) => (
                      <span
                        key={item}
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: "rgba(226, 232, 240, 0.9)",
                          color: "#334155",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="image-tag-card" style={{ marginTop: "18px" }}>
          <strong>No history yet</strong>
          <p>
            Your completed and in-progress generations will show up here after the first studio run.
          </p>
        </div>
      )}
    </section>
  );
}
