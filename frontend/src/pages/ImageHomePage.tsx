import { Link } from "react-router-dom";
import {
  IMAGE_APP_NAME,
  IMAGE_ASPECT_RATIO_OPTIONS,
  IMAGE_GENERATION_STYLE_OPTIONS,
  IMAGE_HOME_VALUE_POINTS,
  IMAGE_PROMPT_EXAMPLES,
  IMAGE_ROUTE_PATHS,
} from "../features/imageStudio/constants";

export function ImageHomePage() {
  return (
    <main className="image-shell">
      <section className="image-hero">
        <div className="image-hero__copy">
          <span className="image-eyebrow">图片 MVP</span>
          <h1>为你的下一条内容、视频或上新活动生成更吸睛的视觉图。</h1>
          <p>
            {IMAGE_APP_NAME} 是一个面向内容创作者的 AI 图片工作台。你可以先选类型、比例和风格，
            再补充主体与场景要求，快速生成适合封面、宣传图和品牌视觉的内容，而不用自己从零打磨
            长提示词。
          </p>
          <div className="image-hero__actions">
            <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.studio}>
              开始生成
            </Link>
            <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.pricing}>
              查看升级
            </Link>
          </div>
          <ul className="image-checklist">
            {IMAGE_HOME_VALUE_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="image-panel">
          <div className="image-panel__header">
            <span>热门提示词示例</span>
            <Link to={IMAGE_ROUTE_PATHS.login}>邮箱登录</Link>
          </div>
          <div className="image-samples">
            {IMAGE_PROMPT_EXAMPLES.map((example) => (
              <article key={example.title} className="image-sample-card">
                <div className="image-sample-card__meta">
                  <strong>{example.title}</strong>
                  <span>
                    {example.style} • {example.aspectRatio}
                  </span>
                </div>
                <p>{example.prompt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="image-grid">
        <article className="image-panel">
          <div className="image-panel__header">
            <span>首版支持比例</span>
          </div>
          <div className="image-tag-grid">
            {IMAGE_ASPECT_RATIO_OPTIONS.map((option) => (
              <div key={option.value} className="image-tag-card">
                <strong>{option.label}</strong>
                <span>{option.value}</span>
                <p>{option.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="image-panel">
          <div className="image-panel__header">
            <span>创作者常用风格预设</span>
          </div>
          <div className="image-tag-grid">
            {IMAGE_GENERATION_STYLE_OPTIONS.map((option) => (
              <div key={option.value} className="image-tag-card">
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
