import { useState, type FormEvent } from "react";
import {
  IMAGE_ASPECT_RATIO_OPTIONS,
  IMAGE_GENERATION_STYLE_OPTIONS,
  IMAGE_PROMPT_EXAMPLES,
} from "../constants";
import type { GenerationFormValues } from "../api";

interface GenerationFormProps {
  isSubmitting?: boolean;
  onSubmit: (values: GenerationFormValues) => void | Promise<void>;
}

const IMAGE_TYPE_OPTIONS = [
  { value: "social-visual", label: "Social visual" },
  { value: "xiaohongshu-cover", label: "Xiaohongshu cover" },
  { value: "wechat-header", label: "WeChat header" },
  { value: "poster", label: "Poster" },
  { value: "general-illustration", label: "General illustration" },
] as const;

const defaultValues: GenerationFormValues = {
  imageType: "social-visual",
  aspectRatio: "1:1",
  style: "product",
  scene: "A polished creator workspace with intentional props and crisp lighting.",
  whitespace: "Leave enough negative space for a headline and CTA without crowding the subject.",
  subjectText: "A creator-focused promo image for a new content drop.",
  extraRequirements: "",
};

export function GenerationForm({ isSubmitting = false, onSubmit }: GenerationFormProps) {
  const [values, setValues] = useState<GenerationFormValues>(defaultValues);

  const updateValue = <Key extends keyof GenerationFormValues>(
    key: Key,
    value: GenerationFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      ...values,
      scene: values.scene.trim(),
      whitespace: values.whitespace.trim(),
      subjectText: values.subjectText.trim(),
      extraRequirements: values.extraRequirements.trim(),
    });
  };

  const applyExample = (index: number) => {
    const example = IMAGE_PROMPT_EXAMPLES[index];
    if (!example) {
      return;
    }

    setValues((current) => ({
      ...current,
      aspectRatio: example.aspectRatio,
      style: example.style,
      subjectText: example.title,
      scene: example.prompt,
    }));
  };

  const buttonLabel = isSubmitting ? "Generating image..." : "Generate image";

  return (
    <section className="image-panel">
      <div className="image-panel__header">
        <span>Generation setup</span>
        <span>1 credit per image</span>
      </div>

      <p className="image-muted">
        Dial in the output type, subject, and layout intent before you send the request to the
        protected generation function.
      </p>

      <div className="image-hero__actions" style={{ marginTop: "18px" }}>
        {IMAGE_PROMPT_EXAMPLES.map((example, index) => (
          <button
            className="image-button image-button--secondary"
            key={example.title}
            onClick={() => applyExample(index)}
            type="button"
          >
            Use {example.title}
          </button>
        ))}
      </div>

      <form className="image-form" onSubmit={handleSubmit}>
        <label className="image-label" htmlFor="image-type">
          Output type
        </label>
        <select
          className="image-input"
          disabled={isSubmitting}
          id="image-type"
          onChange={(event) => updateValue("imageType", event.target.value)}
          value={values.imageType}
        >
          {IMAGE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="image-label" htmlFor="subject-text">
          Subject or headline idea
        </label>
        <textarea
          className="image-input"
          disabled={isSubmitting}
          id="subject-text"
          onChange={(event) => updateValue("subjectText", event.target.value)}
          rows={3}
          style={{ padding: "14px", minHeight: "112px" }}
          value={values.subjectText}
        />

        <label className="image-label" htmlFor="scene">
          Scene or environment
        </label>
        <textarea
          className="image-input"
          disabled={isSubmitting}
          id="scene"
          onChange={(event) => updateValue("scene", event.target.value)}
          rows={4}
          style={{ padding: "14px", minHeight: "132px" }}
          value={values.scene}
        />

        <label className="image-label" htmlFor="style">
          Style preset
        </label>
        <select
          className="image-input"
          disabled={isSubmitting}
          id="style"
          onChange={(event) => updateValue("style", event.target.value as GenerationFormValues["style"])}
          value={values.style}
        >
          {IMAGE_GENERATION_STYLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>

        <label className="image-label" htmlFor="aspect-ratio">
          Aspect ratio
        </label>
        <select
          className="image-input"
          disabled={isSubmitting}
          id="aspect-ratio"
          onChange={(event) =>
            updateValue("aspectRatio", event.target.value as GenerationFormValues["aspectRatio"])}
          value={values.aspectRatio}
        >
          {IMAGE_ASPECT_RATIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.value}) - {option.description}
            </option>
          ))}
        </select>

        <label className="image-label" htmlFor="whitespace">
          Composition and whitespace
        </label>
        <textarea
          className="image-input"
          disabled={isSubmitting}
          id="whitespace"
          onChange={(event) => updateValue("whitespace", event.target.value)}
          rows={3}
          style={{ padding: "14px", minHeight: "112px" }}
          value={values.whitespace}
        />

        <label className="image-label" htmlFor="extra-requirements">
          Extra requirements
        </label>
        <textarea
          className="image-input"
          disabled={isSubmitting}
          id="extra-requirements"
          onChange={(event) => updateValue("extraRequirements", event.target.value)}
          placeholder="Optional details like brand colors, camera angle, or text-safe zones."
          rows={3}
          style={{ padding: "14px", minHeight: "112px" }}
          value={values.extraRequirements}
        />

        <button className="image-button image-button--primary" disabled={isSubmitting} type="submit">
          {buttonLabel}
        </button>
      </form>
    </section>
  );
}
