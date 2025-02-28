import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        primaryHover: "var(--primary-hover)",
        secondary: "var(--secondary)",
        secondaryHover: "var(--secondary-hover)",
        accent: "var(--accent)",
        error: "var(--error)",
      },
      fontFamily: {
        general: "var(--font-general)",
        brand: "var(--font-brand)",
      },
    },
  },
  plugins: [],
} satisfies Config;
