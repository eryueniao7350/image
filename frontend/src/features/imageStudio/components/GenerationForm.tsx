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
  { value: "social-visual", label: "社媒配图" },
  { value: "xiaohongshu-cover", label: "小红书封面" },
  { value: "wechat-header", label: "公众号头图" },
  { value: "poster", label: "海报" },
  { value: "general-illustration", label: "通用插画" },
] as const;

const defaultValues: GenerationFormValues = {
  imageType: "social-visual",
  aspectRatio: "1:1",
  style: "product",
  scene: "一个干净利落的创作者工作空间，布景有层次，灯光清晰自然。",
  whitespace: "为标题和行动按钮预留足够留白，但不要让主体显得拥挤。",
  subjectText: "一张用于内容上新的创作者宣传图。",
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

  const buttonLabel = isSubmitting ? "正在生成图片..." : "生成图片";

  return (
    <section className="image-panel">
      <div className="image-panel__header">
        <span>生成设置</span>
        <span>每张消耗 1 积分</span>
      </div>

      <p className="image-muted">
        先选输出类型、主体方向和构图要求，再把请求发送到受保护的生图服务。
      </p>

      <div className="image-hero__actions" style={{ marginTop: "18px" }}>
        {IMAGE_PROMPT_EXAMPLES.map((example, index) => (
          <button
            className="image-button image-button--secondary"
            key={example.title}
            onClick={() => applyExample(index)}
            type="button"
          >
            使用“{example.title}”
          </button>
        ))}
      </div>

      <form className="image-form" onSubmit={handleSubmit}>
        <label className="image-label" htmlFor="image-type">
          图片类型
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
          主体或标题方向
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
          场景或环境
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
          风格预设
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
          图片比例
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
          构图与留白
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
          补充要求
        </label>
        <textarea
          className="image-input"
          disabled={isSubmitting}
          id="extra-requirements"
          onChange={(event) => updateValue("extraRequirements", event.target.value)}
          placeholder="可选补充品牌颜色、镜头角度、文案安全区等细节。"
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
