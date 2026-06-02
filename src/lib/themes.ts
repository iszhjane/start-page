// =====================================================================
// 主题样式应用器
// - 切换 default / pixel 主题
// - 加载对应字体（仅 pixel 需要 ZLabPixel woff2）
// - 字体加载完后才把 data-style 写入 html，避免字体未到位的闪屏
// =====================================================================

import type { ThemeMode, ThemeStyle } from "./store";

type FontEntry = { family: string; weight?: number; url: string };

// 仅 pixel 主题需要远程字体（Z工坊像素黑体 12px）
// default 走系统字体栈，无需预加载
const FONTS: Record<Exclude<ThemeStyle, "default">, FontEntry[]> = {
  pixel: [
    {
      family: "ZLabPixel",
      weight: 500,
      url: "/fonts/ZLabsPixel_12px_M_CN.ttf.woff2",
    },
  ],
};

const loaded = new Set<string>();

function loadFont(entry: FontEntry): Promise<void> {
  const key = `${entry.family}@${entry.weight ?? 400}@${entry.url}`;
  if (loaded.has(key)) return Promise.resolve();
  loaded.add(key);

  return new Promise((resolve) => {
    try {
      const face = new FontFace(entry.family, `url(${entry.url})`, {
        weight: String(entry.weight ?? 400),
        display: "swap",
      });
      const timer = setTimeout(resolve, 2000);
      face
        .load()
        .then((loadedFace) => {
          clearTimeout(timer);
          (document as Document & { fonts: FontFaceSet }).fonts.add(loadedFace);
          resolve();
        })
        .catch(() => {
          clearTimeout(timer);
          resolve();
        });
    } catch {
      resolve();
    }
  });
}

function loadThemeFonts(style: ThemeStyle): Promise<void> {
  const list = FONTS[style as keyof typeof FONTS];
  if (!list) return Promise.resolve();
  return Promise.all(list.map(loadFont)).then(() => undefined);
}

export async function applyStyle(style: ThemeStyle): Promise<void> {
  await loadThemeFonts(style);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.style = style;
  }
}

export function applyMode(mode: ThemeMode): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.mode = mode;
  }
}

export function applyTheme(mode: ThemeMode, style: ThemeStyle): Promise<void> {
  applyMode(mode);
  return applyStyle(style);
}

export const THEME_OPTIONS: { id: ThemeStyle; label: string; description: string }[] = [
  { id: "default", label: "Default", description: "Inter + Source Code Pro，浅/深双模式，柔和通透" },
  { id: "pixel", label: "Pixel", description: "Z工坊像素黑体 12px，8bit 像素边框 + 像素阴影" },
];
