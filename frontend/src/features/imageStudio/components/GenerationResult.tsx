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
        <span>最新结果</span>
        <span>{result ? "可查看" : "等待首次生成"}</span>
      </div>

      {errorMessage ? (
        <p className="image-alert image-alert--error">{errorMessage}</p>
      ) : null}

      {isSubmitting ? (
        <p className="image-alert image-alert--success" style={{ marginTop: errorMessage ? "14px" : "0" }}>
          图片正在生成中，请保持当前页面打开，等待结果返回。
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
            <strong>最终提示词</strong>
            <span>{result.prompt}</span>
          </div>

          <div className="image-note">
            <strong>生成记录 ID</strong>
            <code>{result.generationId}</code>
          </div>

          <div className="image-note">
            <strong>剩余积分</strong>
            <span>{result.creditsRemaining}</span>
          </div>

          {result.warning ? (
            <p className="image-alert image-alert--error">{result.warning.message}</p>
          ) : null}
        </div>
      ) : (
        <div className="image-tag-card" style={{ marginTop: "18px" }}>
          <strong>还没有图片</strong>
          <p>
            成功生成后，这里会显示图片结果、最终提示词和最新积分余额。
          </p>
        </div>
      )}
    </section>
  );
}
