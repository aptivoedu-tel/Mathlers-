import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FB",
        foreground: "#111827",
        brand: {
          primary: "rgb(var(--brand-primary-rgb) / <alpha-value>)",
          dark: "rgb(var(--brand-dark-rgb) / <alpha-value>)",
          light: "rgb(var(--brand-light-rgb) / <alpha-value>)",
          lighter: "rgb(var(--brand-lighter-rgb) / <alpha-value>)",
        },
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          tertiary: "var(--surface-tertiary)",
          elevated: "var(--surface-elevated)",
        },
        border: {
          light: "var(--border-light)",
          medium: "var(--border-medium)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        // Legacy glass colors (kept for compatibility)
        glass: {
          light: "rgba(255, 255, 255, 0.92)",
          medium: "rgba(255, 255, 255, 0.85)",
          dark: "rgba(255, 255, 255, 0.7)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        'card': '16px',
        'chip': '20px',
        'icon': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'elevated': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.04)',
        'float': '0 16px 48px rgba(0, 0, 0, 0.12)',
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      spacing: {
        '68': '17rem',
        '20': '5rem',
      },
    },
  },
  plugins: [],
};

export default config;
