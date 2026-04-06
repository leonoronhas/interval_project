import nextConfig from "eslint-config-next/core-web-vitals";
import prettierConfig from "eslint-config-prettier";

const config = [
  ...nextConfig,
  prettierConfig,
  {
    rules: {
      // Google Fonts loaded via <link> in layout — intentional
      "@next/next/no-page-custom-font": "off",
    },
  },
  {
    // Config files use anonymous default exports by convention
    files: ["*.config.{js,mjs,ts}", "eslint.config.mjs"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
