export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("firmament_theme") as "light" | "dark") || "light";
}

export function setTheme(theme: "light" | "dark") {
  localStorage.setItem("firmament_theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function applyTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute("data-theme", theme);
}
