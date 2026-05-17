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
        <span className="image-eyebrow">积分不足</span>
        <h2 className="image-title" id="upgrade-modal-title">
          你的生成积分已经用完。
        </h2>
        <p className="image-muted">
          当前首版还没有接入真实支付，但当积分归零后，我们会先拦住新的生成请求，并引导你查看升级说明。
        </p>

        <div className="image-hero__actions">
          <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.pricing}>
            查看升级说明
          </Link>
          <button className="image-button image-button--secondary" onClick={onClose} type="button">
            继续浏览
          </button>
        </div>
      </section>
    </div>
  );
}
