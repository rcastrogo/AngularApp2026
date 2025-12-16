// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const importPlugin = require("eslint-plugin-import");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    plugins: {
      import: importPlugin,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintConfigPrettier, // Siempre al final para desactivar reglas de formato de ESLint
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // --- REGLAS DE ORDENACIÓN DE IMPORTS ---
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling"]],
          pathGroups: [
            {
              pattern: "@angular/**",
              group: "external",
              position: "before",
            },
            {
              pattern: "~/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["angular"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      // --- TUS REGLAS EXISTENTES ---
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      eslintConfigPrettier, // También aquí para los templates
    ],
    rules: {},
  }
]);