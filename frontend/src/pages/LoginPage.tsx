import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { IMAGE_APP_NAME, IMAGE_ROUTE_PATHS } from "../features/imageStudio/constants";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  buildAuthCallbackUrl,
  buildLoginPath,
  sanitizeNextPath,
} from "../utils/routeIntents";

export function LoginPage() {
  const { user, loading, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next") ?? IMAGE_ROUTE_PATHS.studio),
    [searchParams],
  );
  const callbackUrl = useMemo(() => buildAuthCallbackUrl(nextPath), [nextPath]);
  const authUnavailable = !isSupabaseConfigured;

  useEffect(() => {
    if (!loading && user) {
      navigate(nextPath, { replace: true });
    }
  }, [loading, navigate, nextPath, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (authUnavailable) {
      setError("当前环境尚未完成 Supabase 配置，暂时无法发送魔法链接。");
      return;
    }

    setSubmitting(true);

    try {
      await signInWithMagicLink(email, nextPath);
      setSuccess(`魔法链接已发送到 ${email}。请在当前设备上打开邮件继续登录。`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "发送魔法链接失败。";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="image-shell image-shell--narrow">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">登录</span>
        <h1 className="image-title">通过魔法链接登录 {IMAGE_APP_NAME}。</h1>
        <p className="image-muted">
          我们会把安全登录链接发到你的邮箱，并在验证后带你回到 <code>{nextPath}</code>。
        </p>
        {authUnavailable ? (
          <p className="image-alert image-alert--error">
            当前环境尚未完成 Supabase 凭据配置，暂时无法使用登录功能。
          </p>
        ) : null}

        <form className="image-form" onSubmit={handleSubmit}>
          <label className="image-label" htmlFor="email">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="image-input"
            placeholder="you@example.com"
            disabled={authUnavailable}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error ? <p className="image-alert image-alert--error">{error}</p> : null}
          {success ? <p className="image-alert image-alert--success">{success}</p> : null}

          <button
            className="image-button image-button--primary"
            disabled={submitting || authUnavailable}
            type="submit"
          >
            {authUnavailable ? "当前不可用" : submitting ? "发送中..." : "发送魔法链接"}
          </button>
        </form>

        <div className="image-note">
          <strong>回调地址</strong>
          <code>{callbackUrl}</code>
        </div>

        <p className="image-muted">
          想先看看内容？你可以先去 <Link to={buildLoginPath(IMAGE_ROUTE_PATHS.history)}>生成历史</Link> 或{" "}
          <Link to={IMAGE_ROUTE_PATHS.pricing}>升级说明</Link>，也可以返回{" "}
          <Link to={IMAGE_ROUTE_PATHS.hub}>旧版站点</Link>。
        </p>
      </section>
    </main>
  );
}
