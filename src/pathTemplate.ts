export function resolvePathTemplate(
  template: string,
  fileName: string,
  ext: string
): string {
  const now = new Date();
  return template
    .replace(/\{year\}/g, String(now.getFullYear()))
    .replace(/\{month\}/g, String(now.getMonth() + 1).padStart(2, "0"))
    .replace(/\{day\}/g, String(now.getDate()).padStart(2, "0"))
    .replace(/\{timestamp\}/g, String(now.getTime()))
    .replace(/\{fileName\}/g, fileName)
    .replace(/\{ext\}/g, ext);
}

export function sanitizeFileName(rawName: string): {
  fileName: string;
  ext: string;
} {
  const lastDot = rawName.lastIndexOf(".");
  const base = lastDot > 0 ? rawName.substring(0, lastDot) : rawName;
  const rawExt = lastDot > 0 ? rawName.substring(lastDot + 1) : "";

  let sanitized = base
    .replace(/[^a-zA-Z0-9_\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!sanitized) {
    sanitized = `image-${Date.now()}`;
  }

  return {
    fileName: sanitized,
    ext: rawExt.toLowerCase() || "png",
  };
}
