/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#e9ecef",
        input: "#f8f9fa",
        ring: "#1a1a1a",
        background: "#ffffff",
        foreground: "#1a1a1a",
        primary: {
          DEFAULT: "#1a1a1a",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#6c757d",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#1a1a1a",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8f9fa",
          foreground: "#6c757d",
        },
        accent: {
          DEFAULT: "#e9ecef",
          foreground: "#1a1a1a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}