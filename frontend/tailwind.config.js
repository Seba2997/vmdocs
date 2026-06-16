/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#f8f9fd",
        "surface-dim": "#d9dade",
        "surface-bright": "#f8f9fd",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3f7",
        "surface-container": "#edeef2",
        "surface-container-high": "#e7e8ec",
        "surface-container-highest": "#e1e2e6",
        "on-surface": "#191c1f",
        "on-surface-variant": "#464651",
        "inverse-surface": "#2e3134",
        "inverse-on-surface": "#eff1f5",
        "outline": "#777682",
        "outline-variant": "#c7c5d3",
        "surface-tint": "#5355aa",
        "primary": "#040053",
        "on-primary": "#ffffff",
        "primary-container": "#191970",
        "on-primary-container": "#8386de",
        "inverse-primary": "#c0c1ff",
        "secondary": "#5c5f62",
        "on-secondary": "#ffffff",
        "secondary-container": "#dee0e4",
        "on-secondary-container": "#606366",
        "tertiary": "#2a0700",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#4d1300",
        "on-tertiary-container": "#d07658",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#e1e0ff",
        "primary-fixed-dim": "#c0c1ff",
        "on-primary-fixed": "#0a0565",
        "on-primary-fixed-variant": "#3b3d90",
        "secondary-fixed": "#e0e2e6",
        "secondary-fixed-dim": "#c4c7ca",
        "on-secondary-fixed": "#191c1f",
        "on-secondary-fixed-variant": "#44474a",
        "tertiary-fixed": "#ffdbd0",
        "tertiary-fixed-dim": "#ffb59d",
        "on-tertiary-fixed": "#390c00",
        "on-tertiary-fixed-variant": "#773219",
        "background": "#f8f9fd",
        "on-background": "#191c1f",
        "surface-variant": "#e1e2e6"
      },
      fontFamily: {
        "display-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "title-sm": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "table-cell": ["Inter", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "table-cell": ["14px", { lineHeight: "18px", fontWeight: "400" }]
      },
      spacing: {
        "base": "8px",
        "margin-page": "32px",
        "gutter-table": "16px",
        "padding-card": "24px",
        "stack-sm": "4px",
        "stack-md": "12px",
        "stack-lg": "24px"
      },
      borderRadius: {
        "sm": "0.125rem",
        "DEFAULT": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
