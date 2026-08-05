"use strict";

const themeButton = document.querySelector("#themeButton");

function applySiteTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#080c0b" : "#f7faf9";
  themeButton?.setAttribute("aria-label", theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối");
  localStorage.setItem("snake-theme", theme);
}

themeButton?.addEventListener("click", () => {
  applySiteTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem("snake-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applySiteTheme(savedTheme || preferredTheme);
