export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/const\s+targetSpan\s*=[\s\S]*?targetSpan\.innerHTML\s*=/, "")
    .replace(/window\.matchMedia\([^)]+\)\s*;/g, "")
    .replace(/\.innerHTML\s*=\s*original/g, "")
    .replace(/if\s*\(e\.matches\)\s*\{[^}]*\}/g, "")
    .replace(/Save the original text[\s\S]*?on smaller screens/g, "")
    .replace(/Create a media query[\s\S]*?996px/g, "")
    .replace(/Function to handle[\s\S]*?text replacement/g, "")
    .replace(/If screen is[\s\S]*?996px/g, "")
    .replace(/replace the comma[\s\S]*?with a/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  const scripts = div.querySelectorAll("script, style");
  scripts.forEach((el) => el.remove());
  return div.textContent || div.innerText || "";
}