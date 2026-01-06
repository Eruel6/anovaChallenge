import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-bs-theme");
  if (attr === "dark" || attr === "light") return attr;

  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, toggleTheme, setTheme };
}
