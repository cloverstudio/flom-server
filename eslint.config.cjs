const { defineConfig, globalIgnores } = require("eslint/config");
const globals = require("globals");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// globalIgnores([])

module.exports = defineConfig([
  globalIgnores(["**/SampleController.js", "**/UpdateOrderController.js"]),
  {
    extends: compat.extends("eslint:recommended"),

    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },

      ecmaVersion: 2022,
      sourceType: "commonjs",
    },

    rules: {
      "no-unused-vars": 0,
      "no-extra-boolean-cast": 0,
      "no-case-declarations": 0,
      "no-constant-condition": 0,
    },
  },
]);
