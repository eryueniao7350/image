export type ImageAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export type ImageGenerationStyle =
  | "product"
  | "lifestyle"
  | "portrait"
  | "editorial"
  | "illustration";

export interface ImageAspectRatioOption {
  value: ImageAspectRatio;
  label: string;
  description: string;
}

export interface ImageGenerationStyleOption {
  value: ImageGenerationStyle;
  label: string;
  description: string;
}

export interface ImagePromptExample {
  title: string;
  prompt: string;
  style: ImageGenerationStyle;
  aspectRatio: ImageAspectRatio;
}
