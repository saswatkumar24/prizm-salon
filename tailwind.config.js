/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#12141F",
        "surface-border": "#1E2235",
        neon: {
          cyan: "#00F0FF",
          pink: "#FF007A",
          purple: "#7928CA",
          lime: "#10B981"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'prism-glow': 'radial-gradient(circle at 50% 0%, rgba(121, 40, 202, 0.25), transparent 70%)',
      }
    },
  },
  plugins: [],
};
