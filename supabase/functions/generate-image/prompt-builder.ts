export interface PromptInput {
  imageType: string;
  aspectRatio: string;
  style: string;
  scene: string;
  whitespace: string;
  subjectText: string;
  extraRequirements: string;
}

const imageTypeMap: Record<string, string> = {
  "xiaohongshu-cover":
    "A striking social cover image designed for Xiaohongshu-style content.",
  "wechat-header": "A polished header image for a WeChat article.",
  "social-visual": "A social media visual optimized for modern creator posts.",
  poster: "A promotional poster image with clear visual hierarchy.",
  "general-illustration": "A versatile creator-friendly illustration.",
};

export function buildPrompt(input: PromptInput): string {
  const sections = [
    imageTypeMap[input.imageType] ?? "A creator-focused marketing image.",
    `Primary subject: ${input.subjectText}.`,
    `Style direction: ${input.style}.`,
    `Scene or environment: ${input.scene}.`,
    `Composition and whitespace: ${input.whitespace}.`,
    `Aspect ratio target: ${input.aspectRatio}.`,
    "Visual requirements: high quality, clear focal point, clean composition, not cluttered, suitable for creator publishing.",
    input.extraRequirements
      ? `Additional requirements: ${input.extraRequirements}.`
      : "",
  ];

  return sections.filter(Boolean).join(" ");
}
