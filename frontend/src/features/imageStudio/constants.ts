import type {
  ImageAspectRatioOption,
  ImageGenerationStyleOption,
  ImagePromptExample,
} from "./types";

export const IMAGE_APP_NAME = "Pixel Forge";

export const IMAGE_ROUTE_PATHS = {
  home: "/",
  hub: "/hub",
  login: "/login",
  callback: "/auth/callback",
  studio: "/studio",
  history: "/history",
  pricing: "/pricing",
} as const;

export const IMAGE_ASPECT_RATIO_OPTIONS: ImageAspectRatioOption[] = [
  {
    value: "1:1",
    label: "Square",
    description: "Balanced framing for thumbnails, profile posts, and cover art.",
  },
  {
    value: "3:4",
    label: "Portrait",
    description: "A creator-friendly vertical crop for portraits, tutorials, and promos.",
  },
  {
    value: "4:3",
    label: "Landscape",
    description: "A classic frame for thumbnails, desktop visuals, and stream graphics.",
  },
  {
    value: "16:9",
    label: "Widescreen",
    description: "Wide output for video covers, YouTube assets, and hero visuals.",
  },
  {
    value: "9:16",
    label: "Story",
    description: "Vertical output sized for reels, stories, and short-form creator content.",
  },
];

export const IMAGE_GENERATION_STYLE_OPTIONS: ImageGenerationStyleOption[] = [
  {
    value: "product",
    label: "Product",
    description: "Clean lighting and detail-first composition for merch, kits, and drops.",
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
    description: "Human, warm scenes that make creator content feel lived-in and real.",
  },
  {
    value: "portrait",
    label: "Portrait",
    description: "Character-led framing for creators, hosts, and personal brands.",
  },
  {
    value: "editorial",
    label: "Editorial",
    description: "Sharp layouts with art-direction energy for launches, covers, and promos.",
  },
  {
    value: "illustration",
    label: "Illustration",
    description: "Stylized scenes for explainers, series art, and playful channel branding.",
  },
];

export const IMAGE_PROMPT_EXAMPLES: ImagePromptExample[] = [
  {
    title: "Channel launch cover",
    prompt:
      "A creator desk setup with camera, mic, and neon accent light, cinematic shadows, polished YouTube channel cover aesthetic.",
    style: "product",
    aspectRatio: "16:9",
  },
  {
    title: "Creator portrait",
    prompt:
      "Confident creator in a warm studio, natural side light, editorial portrait composition, textured background, relaxed posture.",
    style: "portrait",
    aspectRatio: "3:4",
  },
  {
    title: "Reel teaser frame",
    prompt:
      "Streetwear creator mid-jump with bold color blocking, energetic motion blur, short-form teaser aesthetic, high contrast lighting.",
    style: "lifestyle",
    aspectRatio: "9:16",
  },
];

export const IMAGE_HOME_VALUE_POINTS = [
  "Turn rough ideas into creator-ready thumbnails, covers, and promo frames fast.",
  "Switch between the MVP ratios you actually need for posts, videos, and stories.",
  "Jump from magic-link sign-in straight into the protected studio flow.",
] as const;
