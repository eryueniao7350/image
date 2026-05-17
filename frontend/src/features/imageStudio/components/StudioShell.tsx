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
  onUpgrade?: () => Promise<void> | void;
  onManageSubscription?: () => Promise<void> | void;
  billingStatus?: ReactNode;
  isCheckingOut?: boolean;
  isOpeningPortal?: boolean;
  profileStatus?: ReactNode;
}

export function StudioShell({
  children,
  credits,
  creditsLoading = false,
  email,
  onSignOut,
  onUpgrade,
  onManageSubscription,
  billingStatus,
  isCheckingOut = false,
  isOpeningPortal = false,
  profileStatus,
}: StudioShellProps) {
  return (
    <main className="image-shell">
      <section
        className="image-hero"
        style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(320px, 1.1fr)", alignItems: "start" }}
      >
        <div className="image-hero__copy">
          <span className="image-eyebrow">工作台</span>
          <h1>{IMAGE_APP_NAME} 已可直接在线生成图片。</h1>
          <p>
            登录后你可以在这里消耗积分生成图片，实时看到最新结果，并在不离开当前页面的情况下继续
            调整需求和再次出图。
          </p>
          <div className="image-hero__actions">
            <CreditBadge credits={credits} loading={creditsLoading} />
          </div>
          {profileStatus ? <div style={{ marginTop: "18px" }}>{profileStatus}</div> : null}
          <ul className="image-checklist">
            <li>当前页面已受魔法链接登录保护。</li>
            <li>每次成功生成后，剩余积分会立即更新。</li>
            <li>积分不足时会先弹出升级提示，不会继续调用后端生成。</li>
          </ul>
        </div>

        <aside className="image-panel">
          <div className="image-panel__header">
            <span>当前会话</span>
            <button className="image-button image-button--secondary" onClick={() => void onSignOut()} type="button">
              退出登录
            </button>
          </div>
          <div className="image-tag-grid">
            <div className="image-tag-card">
              <strong>当前登录账号</strong>
              <p>{email ?? "未知用户"}</p>
            </div>
            <div className="image-tag-card">
              <strong>想继续生成更多图片？</strong>
              <p>
                Stripe 订阅入口已经接好。积分用完后可以直接升级，付费后再用 Customer Portal 管理订阅。
              </p>
            </div>
            <div className="image-hero__actions" style={{ marginTop: 0 }}>
              {onUpgrade ? (
                <button
                  className="image-button image-button--primary"
                  disabled={isCheckingOut || isOpeningPortal}
                  onClick={() => void onUpgrade()}
                  type="button"
                >
                  {isCheckingOut ? "正在跳转支付..." : "升级 Pro"}
                </button>
              ) : (
                <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.pricing}>
                  查看套餐
                </Link>
              )}
              {onManageSubscription ? (
                <button
                  className="image-button image-button--secondary"
                  disabled={isCheckingOut || isOpeningPortal}
                  onClick={() => void onManageSubscription()}
                  type="button"
                >
                  {isOpeningPortal ? "正在打开..." : "管理订阅"}
                </button>
              ) : null}
              <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.hub}>
                返回旧站
              </Link>
            </div>
            {billingStatus ? <div style={{ marginTop: "16px" }}>{billingStatus}</div> : null}
          </div>
        </aside>
      </section>

      <section className="image-grid" style={{ gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)" }}>
        {children}
      </section>
    </main>
  );
}
