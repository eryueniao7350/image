import { Link } from "react-router-dom";
import { IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";

export function PricingPage() {
  return (
    <main className="image-shell">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">升级说明</span>
        <h1 className="image-title">首版升级方案还没有最终定稿。</h1>
        <p className="image-muted">
          当前页面先作为升级入口占位使用，方便在积分用完时承接用户，不提前承诺套餐、额度或支付规则。
        </p>

        <div className="image-hero__actions">
          <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.login}>
            继续登录
          </Link>
          <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.home}>
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
