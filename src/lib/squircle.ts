import {
  generateClipPath,
  createSvgEffects,
  extractAndStripEffects,
  type SmoothCornerOptions,
  type SvgEffectsHandle,
} from "@lisse/core";

const applied = new WeakSet<Element>();
const effects = new WeakMap<Element, SvgEffectsHandle>();

export function applySquircle(selector = "[data-squircle]"): void {
  if (document.documentElement.dataset.style === "pixel") return;
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (applied.has(el)) return;
    applied.add(el);

    const radius = parseFloat(el.dataset.squircleRadius || "") || 16;
    const smoothing = parseFloat(el.dataset.squircleSmoothing || "") || 0.6;
    const options: SmoothCornerOptions = { radius, curve: "squircle", smoothing };

    // 把 CSS border / box-shadow 提取并转 SVG，clip-path 不会再裁掉它们
    const extracted = extractAndStripEffects(el);
    const handle = createSvgEffects(el);
    effects.set(el, handle);

    const update = (): void => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w === 0 || h === 0) return;
      try {
        el.style.clipPath = generateClipPath(w, h, options);
        handle.update(options, extracted.effects, w, h);
      } catch {}
    };

    update();
    new ResizeObserver(update).observe(el);
  });
}
