import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";
import { useBillingActions } from "../features/imageStudio/hooks/useBillingActions";
import { buildLoginPath } from "../utils/routeIntents";

export function PricingPage() {
  const { user, loading } = useAuth();
  const {
    errorMessage,
    isCheckingOut,
    isOpeningPortal,
    openCustomerPortal,
    startCheckout,
  } = useBillingActions();

  return (
    <main className="image-shell">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">Stripe 升级</span>
        <h1 className="image-title">解锁付费订阅，继续生成更多图片。</h1>
        <p className="image-muted">
          第一版已经接好了 Stripe Checkout 和 Customer Portal。支付完成后，积分会通过 webhook 自动发放到你的账号。
        </p>
        <div className="image-tag-grid" style={{ marginTop: "8px" }}>
          <div className="image-tag-card">
            <strong>Pro 月付</strong>
            <p>适合持续产出内容的创作者，后续可以在 Stripe 客户门户里自行管理或取消订阅。</p>
          </div>
        </div>
        {errorMessage ? <p className="image-alert image-alert--error">{errorMessage}</p> : null}

        <div className="image-hero__actions">
          {user ? (
            <>
              <button
                className="image-button image-button--primary"
                disabled={isCheckingOut || isOpeningPortal}
                onClick={() => void startCheckout()}
                type="button"
              >
                {isCheckingOut ? "正在跳转支付..." : "立即升级 Pro"}
              </button>
              <button
                className="image-button image-button--secondary"
                disabled={isCheckingOut || isOpeningPortal}
                onClick={() => void openCustomerPortal()}
                type="button"
              >
                {isOpeningPortal ? "正在打开..." : "管理订阅"}
              </button>
            </>
          ) : (
            <Link className="image-button image-button--primary" to={buildLoginPath(IMAGE_ROUTE_PATHS.pricing)}>
              {loading ? "正在检查登录..." : "先登录再升级"}
            </Link>
          )}
          <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.studio}>
            返回工作台
          </Link>
          <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.home}>
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
