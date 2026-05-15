import type { GenerationResultRecord } from "../api";

interface GenerationResultProps {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  result: GenerationResultRecord | null;
}

export function GenerationResult({
  errorMessage = null,
  isSubmitting = false,
  result,
}: GenerationResultProps) {
  return (
    <section className="image-panel">
      <div className="image-panel__header">
        <span>Latest result</span>
        <span>{result ? "Ready to review" : "Waiting for your first generation"}</span>
      </div>

      {errorMessage ? (
        <p className="image-alert image-alert--error">{errorMessage}</p>
      ) : null}

      {isSubmitting ? (
        <p className="image-alert image-alert--success" style={{ marginTop: errorMessage ? "14px" : "0" }}>
          Your image is being generated now. Keep this tab open while the result comes back.
        </p>
      ) : null}

      {result ? (
        <div className="image-tag-grid" style={{ marginTop: "18px" }}>
          <figure
            className="image-sample-card"
            style={{ margin: 0, overflow: "hidden", padding: "0", background: "#e2e8f0" }}
          >
            <img
              alt={result.prompt}
              src={result.imageUrl}
              style={{ display: "block", width: "100%", height: "auto", objectFit: "cover" }}
            />
          </figure>

          <div className="image-note">
            <strong>Final prompt</strong>
            <span>{result.prompt}</span>
          </div>

          <div className="image-note">
            <strong>Generation ID</strong>
            <code>{result.generationId}</code>
          </div>

          <div className="image-note">
            <strong>Credits remaining</strong>
            <span>{result.creditsRemaining}</span>
          </div>

          {result.warning ? (
            <p className="image-alert image-alert--error">{result.warning.message}</p>
          ) : null}
        </div>
      ) : (
        <div className="image-tag-card" style={{ marginTop: "18px" }}>
          <strong>No image yet</strong>
          <p>
            Your generated image, final prompt, and the updated credit count will show up here
            after a successful run.
          </p>
        </div>
      )}
    </section>
  );
}
