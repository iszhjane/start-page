export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

export function showToast(msg: string, kind: "info" | "error" = "info"): void {
  window.dispatchEvent(new CustomEvent("toast", { detail: { msg, kind } }));
}

let _savedFocus: Element | null = null;

export function saveFocus(): void {
  _savedFocus = document.activeElement;
}

export function restoreFocus(): void {
  if (_savedFocus instanceof HTMLElement) {
    _savedFocus.focus();
    _savedFocus = null;
  }
}

export function openUrls(urls: string[]): void {
  urls.forEach((url, i) => {
    setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), i * 100);
  });
}
