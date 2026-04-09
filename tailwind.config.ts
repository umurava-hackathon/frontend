import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        calm: {
          primary: "#1F2A37",
          muted: "#6B7280",
          ring: "#2563EB",
          pillGreen: "#16A34A",
          pillAmber: "#F59E0B"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;

