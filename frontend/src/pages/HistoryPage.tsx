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
          <span>当前选中记录</span>
          <span>{selected ? formatDateTime(selected.createdAt) : "请选择一条记录"}</span>
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
                <strong>没有可预览图片</strong>
                <p>
                  当前记录状态为 <strong>{selected.status}</strong>，因此暂时没有可查看的保存图片。
                </p>
              </div>
            )}

            <div className="image-note">
              <strong>主体摘要</strong>
              <span>{selected.subjectText}</span>
            </div>

            <div className="image-note">
              <strong>最终提示词</strong>
              <span>{selected.finalPrompt ?? "这次记录没有保存最终提示词。"}</span>
            </div>

            <div
              className="image-tag-grid"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
            >
              <div className="image-tag-card">
                <strong>图片类型</strong>
                <p>{titleCase(selected.imageType)}</p>
              </div>
              <div className="image-tag-card">
                <strong>风格</strong>
                <p>{titleCase(selected.style)}</p>
              </div>
              <div className="image-tag-card">
                <strong>比例</strong>
                <p>{selected.aspectRatio}</p>
              </div>
              <div className="image-tag-card">
                <strong>消耗积分</strong>
                <p>{selected.creditCost}</p>
              </div>
              <div className="image-tag-card">
                <strong>状态</strong>
                <p>{titleCase(selected.status)}</p>
              </div>
            </div>

            <div className="image-note">
              <strong>场景</strong>
              <span>{selected.scene}</span>
            </div>

            <div className="image-note">
              <strong>留白要求</strong>
              <span>{selected.whitespace}</span>
            </div>

            <div className="image-note">
              <strong>补充要求</strong>
              <span>{selected.extraRequirements || "这次没有补充额外要求。"}</span>
            </div>
          </div>
        ) : (
          <div className="image-tag-grid" style={{ marginTop: "18px" }}>
            <div className="image-tag-card">
              <strong>还没有选中记录</strong>
              <p>
                你可以先去工作台生成图片，或在历史记录加载完成后从列表里选一条查看。
              </p>
            </div>
            <div className="image-hero__actions" style={{ marginTop: 0 }}>
              <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.studio}>
                打开工作台
              </Link>
              <button className="image-button image-button--secondary" onClick={() => void reload()} type="button">
                重新加载
              </button>
            </div>
          </div>
        )}
      </section>
    </StudioShell>
  );
}
