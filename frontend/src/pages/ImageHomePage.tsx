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
          <span className="image-eyebrow">Image MVP</span>
          <h1>Create scroll-stopping visuals for your next post, video, or drop.</h1>
          <p>
            {IMAGE_APP_NAME} is a conversion-first image studio for content creators who need
            clean thumbnails, vertical promos, and branded visuals without getting stuck in a
            slow design loop. Start with a prompt, choose a ratio, and move into the protected
            studio flow when you are ready to create.
          </p>
          <div className="image-hero__actions">
            <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.studio}>
              Start generating
            </Link>
            <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.pricing}>
              View pricing
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
            <span>Popular prompt patterns</span>
            <Link to={IMAGE_ROUTE_PATHS.login}>Magic-link sign in</Link>
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
            <span>MVP aspect ratios</span>
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
            <span>Creator-friendly style presets</span>
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
