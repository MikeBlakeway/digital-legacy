const themeScript = `
(() => {
  const storageKey = "digital-legacy-theme";
  const changeEvent = "digital-legacy-theme-change";
  const lightColor = "#f9f8f6";
  const darkColor = "#18130f";

  const applyTheme = () => {
    let preference = "system";

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark") preference = stored;
    } catch {}

    const isDark = preference === "dark" ||
      (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const theme = isDark ? "dark" : "light";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.getElementById("theme-color")?.setAttribute(
      "content",
      isDark ? darkColor : lightColor,
    );
    window.dispatchEvent(new Event(changeEvent));
  };

  applyTheme();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
  window.addEventListener("storage", applyTheme);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTheme, { once: true });
  }
})();
`;

export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
