import tailwindcss from "@tailwindcss/postcss";
import { directionCss } from "./build/direction-css.mjs";

// Tailwind first, then the step that mirrors direction-dependent rules for
// left-to-right pages (build/direction-css.mjs).
const config = {
  plugins: [tailwindcss(), directionCss()],
};

export default config;
