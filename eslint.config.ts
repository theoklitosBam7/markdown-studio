import pluginVitest from "@vitest/eslint-plugin";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import skipFormatting from "eslint-config-prettier/flat";
import boundaries, { type Config, type Settings } from "eslint-plugin-boundaries";
import pluginCypress from "eslint-plugin-cypress";
import pluginOxlint from "eslint-plugin-oxlint";
import perfectionist from "eslint-plugin-perfectionist";
import pluginVue from "eslint-plugin-vue";
import { globalIgnores } from "eslint/config";

const featureTypes = [
  "feature",
  "feature-component",
  "feature-composable",
  "feature-store",
  "feature-service",
  "feature-type",
  "feature-index",
];

const uiTypes = ["ui", "ui-base", "ui-icons"];
const appTypes = ["app", "app-config", "app-plugin", "app-provider"];
const globalLayerTypes = ["global-store", "global-service", "global-composable"];
const structuralTypes = ["view", "layout", "router"];

const sameFeatureSelector = (type: string | string[]) => ({
  type,
  captured: { feature: "{{from.captured.feature}}" },
});

const differentFeatureSelector = (type: string | string[]) => ({
  type,
  captured: { feature: "!{{from.captured.feature}}" },
});

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{vue,ts,mts,tsx}"],
  },

  globalIgnores([
    "**/dist/**",
    "**/dist-ssr/**",
    "**/coverage/**",
    "**/node_modules/**",
    "eslint.config.ts",
  ]),

  ...pluginVue.configs["flat/recommended"],
  {
    files: ["*.vue", "**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  vueTsConfigs.recommended,

  {
    ...pluginCypress.configs.recommended,
    files: ["cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}", "cypress/support/**/*.{js,ts,jsx,tsx}"],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/__tests__/*"],
  },

  {
    plugins: {
      perfectionist,
    },
    rules: {
      ...perfectionist.configs["recommended-alphabetical"].rules,
      "perfectionist/sort-objects": [
        "error",
        {
          type: "unsorted", // Don't sort objects with a "do not sort" comment
          useConfigurationIf: {
            declarationCommentMatchesPattern: { pattern: "^do not sort$", scope: "deep" },
          },
        },
        {
          type: "alphabetical", // Fallback configuration
        },
      ],
    },
  },

  {
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/include": ["src/**/*.ts", "src/**/*.vue"],
      "boundaries/ignore": ["**/*.spec.ts", "**/*.test.ts", "**/__tests__/**"],
      "boundaries/elements": [
        {
          type: "feature-component",
          pattern: "src/features/*/components/**",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "feature-composable",
          pattern: "src/features/*/composables/**",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "feature-store",
          pattern: "src/features/*/store/**",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "feature-service",
          pattern: "src/features/*/services/**",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "feature-type",
          pattern: "src/features/*/types/**",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "feature-index",
          pattern: "src/features/*/index.ts",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "feature",
          pattern: "src/features/*/**",
          capture: ["feature"],
          mode: "full",
        },
        {
          type: "view",
          pattern: "src/views/**",
          mode: "full",
        },
        {
          type: "layout",
          pattern: "src/layouts/**",
          mode: "full",
        },
        {
          type: "router",
          pattern: "src/router/**",
          mode: "full",
        },
        {
          type: "ui-base",
          pattern: "src/components/base/**",
          mode: "full",
        },
        {
          type: "ui-icons",
          pattern: "src/components/icons/**",
          mode: "full",
        },
        {
          type: "ui",
          pattern: "src/components/**",
          mode: "full",
        },
        {
          type: "global-store",
          pattern: "src/stores/**",
          mode: "full",
        },
        {
          type: "global-service",
          pattern: "src/services/**",
          mode: "full",
        },
        {
          type: "utils",
          pattern: "src/utils/**",
          mode: "full",
        },
        {
          type: "global-composable",
          pattern: "src/composables/**",
          mode: "full",
        },
        {
          type: "types",
          pattern: "src/types/**",
          mode: "full",
        },
        {
          type: "styles",
          pattern: "src/styles/**",
          mode: "full",
        },
        {
          type: "assets",
          pattern: "src/assets/**",
          mode: "full",
        },
        {
          type: "app-config",
          pattern: "src/app/config/**",
          mode: "full",
        },
        {
          type: "app-plugin",
          pattern: "src/app/plugins/**",
          mode: "full",
        },
        {
          type: "app-provider",
          pattern: "src/app/providers/**",
          mode: "full",
        },
        {
          type: "app",
          pattern: "src/app/**",
          mode: "full",
        },
        {
          type: "app-root",
          pattern: "src/App.vue",
          mode: "file",
        },
        {
          type: "main",
          pattern: "src/main.ts",
          mode: "file",
        },
      ],
    } satisfies Settings,

    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          checkAllOrigins: true,
          rules: [
            {
              from: { type: featureTypes },
              disallow: [{ to: differentFeatureSelector(featureTypes) }],
              message:
                '🚫 Cross-feature import detected! "${file.type}" in "${file.feature}" cannot import from "${dependency.feature}". Features must be isolated. Use global stores or events for cross-feature communication.',
            },
            {
              from: { type: "view" },
              disallow: [
                {
                  to: {
                    type: [...globalLayerTypes, ...appTypes, "feature-store", "feature-service"],
                  },
                },
              ],
              message:
                '🚫 Views are orchestration layers. "${file.type}" cannot import "${dependency.type}". Use feature composables or components instead of accessing stores/services directly.',
            },
            {
              from: { type: "layout" },
              disallow: [
                {
                  to: {
                    type: [...featureTypes, ...globalLayerTypes, ...structuralTypes, ...appTypes],
                  },
                },
              ],
              message:
                '🚫 Layouts define page structure only. "${file.type}" cannot import "${dependency.type}". No features or business logic allowed in layouts.',
            },
            {
              from: { type: uiTypes },
              disallow: [
                {
                  to: {
                    type: [...featureTypes, ...globalLayerTypes, ...structuralTypes, ...appTypes],
                  },
                },
              ],
              message:
                '🚫 UI components must be pure and reusable. "${file.type}" cannot import "${dependency.type}". No features, stores, or services allowed. Use props and events instead.',
            },
            {
              from: { type: "global-store" },
              disallow: [
                { to: { type: [...featureTypes, ...uiTypes, ...structuralTypes, ...appTypes] } },
              ],
              message:
                '🚫 Global stores handle cross-cutting concerns. "${file.type}" cannot import "${dependency.type}". Global stores cannot depend on features or UI.',
            },
            {
              from: { type: "global-service" },
              disallow: [
                {
                  to: {
                    type: [
                      ...featureTypes,
                      "global-store",
                      ...uiTypes,
                      ...structuralTypes,
                      ...appTypes,
                    ],
                  },
                },
              ],
              message:
                '🚫 Global services are infrastructure. "${file.type}" cannot import "${dependency.type}". Services should be pure and not depend on state or UI.',
            },
            {
              from: { type: "global-composable" },
              disallow: [
                { to: { type: [...featureTypes, ...uiTypes, ...structuralTypes, ...appTypes] } },
              ],
              message:
                '🚫 Global composables must stay generic. "${file.type}" cannot import "${dependency.type}". Use composables for shared logic only.',
            },
            {
              from: { type: "utils" },
              disallow: [
                {
                  to: {
                    type: [
                      ...featureTypes,
                      ...globalLayerTypes,
                      ...uiTypes,
                      ...structuralTypes,
                      ...appTypes,
                      "styles",
                      "assets",
                    ],
                  },
                },
              ],
              message:
                '🚫 Utils must be pure functions. "${file.type}" cannot import "${dependency.type}". Utils should have no side effects and no dependencies on application layers.',
            },
            {
              from: { type: "types" },
              disallow: [
                {
                  to: {
                    type: [
                      ...featureTypes,
                      ...globalLayerTypes,
                      ...uiTypes,
                      ...structuralTypes,
                      ...appTypes,
                      "utils",
                      "styles",
                      "assets",
                    ],
                  },
                },
              ],
              message:
                '🚫 Types are compile-time only. "${file.type}" cannot import "${dependency.type}". Types can only reference other types.',
            },
            {
              from: { type: "feature-component" },
              disallow: [
                { to: sameFeatureSelector("feature-service") },
                { to: { type: ["global-service", ...structuralTypes, ...appTypes] } },
              ],
              message:
                '🚫 Feature components cannot call services directly. "${file.type}" cannot import "${dependency.type}". Use composables to access services.',
            },
            {
              from: { type: "feature-store" },
              disallow: [
                { to: sameFeatureSelector("feature-component") },
                { to: { type: [...structuralTypes, ...uiTypes, ...appTypes] } },
              ],
              message:
                '🚫 Feature stores manage state only. "${file.type}" cannot import "${dependency.type}". Stores should not depend on components or composables.',
            },
            {
              from: { type: "feature-service" },
              disallow: [
                {
                  to: sameFeatureSelector([
                    "feature-component",
                    "feature-composable",
                    "feature-store",
                  ]),
                },
                { to: { type: ["global-store", ...uiTypes, ...structuralTypes, ...appTypes] } },
              ],
              message:
                '🚫 Feature services handle API calls only. "${file.type}" cannot import "${dependency.type}". Services should be stateless and not depend on stores or UI.',
            },
            {
              from: { type: "feature-type" },
              disallow: [
                {
                  to: sameFeatureSelector([
                    "feature-component",
                    "feature-composable",
                    "feature-store",
                    "feature-service",
                  ]),
                },
                {
                  to: {
                    type: [
                      ...globalLayerTypes,
                      ...uiTypes,
                      ...structuralTypes,
                      ...appTypes,
                      "utils",
                      "styles",
                      "assets",
                    ],
                  },
                },
              ],
              message:
                '🚫 Feature types are compile-time only. "${file.type}" cannot import "${dependency.type}". Feature types can only extend shared types.',
            },
            {
              from: { type: "router" },
              disallow: [{ to: { type: [...featureTypes, ...uiTypes, ...appTypes] } }],
              message:
                '🚫 Router defines routes only. "${file.type}" cannot import "${dependency.type}". Router can reference views and layouts, not features directly.',
            },
            {
              from: { type: ["app-root", "main"] },
              disallow: [{ to: { type: [...featureTypes, ...globalLayerTypes, "view"] } }],
              message:
                '🚫 App entry points must stay lean. "${file.type}" cannot import "${dependency.type}". Keep bootstrapping minimal and delegate to app layer.',
            },
            {
              from: { type: uiTypes },
              disallow: [
                {
                  to: { origin: ["external", "core"] },
                  dependency: { module: ["pinia", "vue-router"] },
                },
              ],
              message: "🚫 UI components must be pure. Use composables for state and routing.",
            },
            {
              from: { type: "utils" },
              disallow: [
                {
                  to: { origin: ["external", "core"] },
                  dependency: { module: ["vue", "pinia", "vue-router"] },
                },
              ],
              message:
                "🚫 Utils must be pure TypeScript. No Vue reactivity or framework dependencies.",
            },
            {
              from: { type: "types" },
              disallow: [
                {
                  to: { origin: ["external", "core"] },
                  dependency: { module: ["vue", "pinia", "vue-router"] },
                },
              ],
              message: "🚫 Types are compile-time only. No runtime dependencies allowed.",
            },
          ],
        },
      ],
    },
  } satisfies Config,

  ...pluginOxlint.buildFromOxlintConfigFile(".oxlintrc.json"),

  skipFormatting,
);
