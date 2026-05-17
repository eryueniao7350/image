interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function UpgradeModal({ open, onClose, onUpgrade, isSubmitting = false, errorMessage }: UpgradeModalProps) {
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
        <span className="image-eyebrow">积分不足</span>
        <h2 className="image-title" id="upgrade-modal-title">
          你的生成积分已经用完。
        </h2>
        <p className="image-muted">
          你可以直接跳到 Stripe 托管支付页完成升级。支付成功后，新的订阅积分会通过 webhook 自动发放到你的账号。
        </p>
        {errorMessage ? <p className="image-alert image-alert--error">{errorMessage}</p> : null}

        <div className="image-hero__actions">
          <button
            className="image-button image-button--primary"
            disabled={isSubmitting}
            onClick={() => void onUpgrade()}
            type="button"
          >
            {isSubmitting ? "正在跳转支付..." : "立即升级"}
          </button>
          <button className="image-button image-button--secondary" disabled={isSubmitting} onClick={onClose} type="button">
            继续浏览
          </button>
        </div>
      </section>
    </div>
  );
}
