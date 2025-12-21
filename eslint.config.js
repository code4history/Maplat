import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettierconfig from "eslint-config-prettier";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierconfig,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2015
            },
            ecmaVersion: 2020,
            sourceType: "module"
        },
        rules: {
            "no-unused-vars": "off", // Handled by typescript-eslint
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "arrow-body-style": "error",
            "arrow-parens": ["warn", "as-needed"],
            "arrow-spacing": "error",
            "generator-star-spacing": "error",
            "no-duplicate-imports": "error",
            "no-useless-computed-key": "error",
            "no-useless-constructor": "error",
            "no-useless-rename": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-arrow-callback": "error",
            "prefer-const": "error",
            "prefer-rest-params": "error",
            "prefer-spread": "error",
            "prefer-template": "error",
            "rest-spread-spacing": "error",
            "template-curly-spacing": "error",
            "yield-star-spacing": "error"
        }
    },
    {
        ignores: ["dist/", "node_modules/", "public/", "legacy/", "less/", "assets/"]
    }
];
