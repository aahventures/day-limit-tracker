import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        alert: "readonly",
        confirm: "readonly",
        URL: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        setTimeout: "readonly",
        localStorage: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"],
    },
  },
];
