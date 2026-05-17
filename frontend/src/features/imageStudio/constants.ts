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
    label: "方形",
    description: "适合缩略图、头像贴文和封面图的均衡构图。",
  },
  {
    value: "3:4",
    label: "竖版",
    description: "适合人物图、教程封面和活动宣传的创作者常用比例。",
  },
  {
    value: "4:3",
    label: "横版",
    description: "适合缩略图、桌面视觉和直播图形的经典画幅。",
  },
  {
    value: "16:9",
    label: "宽屏",
    description: "适合视频封面、YouTube 资源位和主视觉横幅。",
  },
  {
    value: "9:16",
    label: "故事流",
    description: "适合 reels、story 和短视频内容的竖向尺寸。",
  },
];

export const IMAGE_GENERATION_STYLE_OPTIONS: ImageGenerationStyleOption[] = [
  {
    value: "product",
    label: "产品感",
    description: "适合周边、套装和上新图的干净布光与细节优先构图。",
  },
  {
    value: "lifestyle",
    label: "生活方式",
    description: "更有人味、更温暖的场景，让内容看起来真实自然。",
  },
  {
    value: "portrait",
    label: "人物肖像",
    description: "适合创作者、主播和个人品牌的人物主导构图。",
  },
  {
    value: "editorial",
    label: "编辑感",
    description: "适合发布、封面和宣传图的利落排版与艺术指导感。",
  },
  {
    value: "illustration",
    label: "插画风",
    description: "适合讲解图、系列视觉和更轻松活泼的频道品牌风格。",
  },
];

export const IMAGE_PROMPT_EXAMPLES: ImagePromptExample[] = [
  {
    title: "频道上线封面",
    prompt:
      "一个创作者桌面场景，包含相机、麦克风和霓虹点缀灯光，电影感阴影，适合作为 YouTube 频道封面的精致视觉。",
    style: "product",
    aspectRatio: "16:9",
  },
  {
    title: "创作者肖像",
    prompt:
      "在温暖摄影棚中的自信创作者，自然侧光，编辑感肖像构图，带纹理背景，姿态放松。",
    style: "portrait",
    aspectRatio: "3:4",
  },
  {
    title: "短视频预告帧",
    prompt:
      "街头风创作者跃起瞬间，强烈撞色，动感运动模糊，短视频预告质感，高对比灯光。",
    style: "lifestyle",
    aspectRatio: "9:16",
  },
];

export const IMAGE_HOME_VALUE_POINTS = [
  "把零散想法快速整理成可直接发布的缩略图、封面图和宣传图。",
  "一键切换首版最常用的发帖、视频和故事流比例。",
  "通过魔法链接登录后，直接进入受保护的生图工作台。",
] as const;
