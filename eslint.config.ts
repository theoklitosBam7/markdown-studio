import pluginVitest from '@vitest/eslint-plugin'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'
import boundaries, { type Config, type Settings } from 'eslint-plugin-boundaries'
import pluginCypress from 'eslint-plugin-cypress'
import pluginOxlint from 'eslint-plugin-oxlint'
import perfectionist from 'eslint-plugin-perfectionist'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

const featureTypes = [
  'feature',
  'feature-component',
  'feature-composable',
  'feature-store',
  'feature-service',
  'feature-type',
]

const uiTypes = ['ui', 'ui-base', 'ui-icons']
const appTypes = ['app', 'app-config', 'app-plugin', 'app-provider']
const globalLayerTypes = ['global-store', 'global-service', 'global-composable']
const structuralTypes = ['view', 'layout', 'router']

const sameFeatureSelector = (type: string | string[]) => ({
  element: {
    type,
    captured: { feature: '{{from.element.captured.feature}}' },
  },
})

const differentFeatureSelector = (type: string | string[]) => ({
  element: {
    type,
    captured: { feature: '!{{from.element.captured.feature}}' },
  },
})

const eslintImportResolverSettings = {
  'import/resolver': {
    typescript: {
      project: './packages/app/tsconfig.json',
    },
  },
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/out/**',
    '**/release/**',
    '**/coverage/**',
    'packages/cli/public/**',
    '**/node_modules/**',
    'eslint.config.ts',
  ]),

  ...pluginVue.configs['flat/recommended'],
  {
    files: ['*.vue', '**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  vueTsConfigs.recommended,

  {
    ...pluginCypress.configs.recommended,
    files: ['cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}', 'cypress/support/**/*.{js,ts,jsx,tsx}'],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['apps/**/__tests__/*', 'packages/**/__tests__/*'],
  },

  {
    plugins: {
      perfectionist,
    },
    rules: {
      ...perfectionist.configs['recommended-alphabetical'].rules,
      'perfectionist/sort-objects': [
        'error',
        {
          type: 'unsorted', // Don't sort objects with a "do not sort" comment
          useConfigurationIf: {
            declarationCommentMatchesPattern: { pattern: '^do not sort$', scope: 'deep' },
          },
        },
        {
          type: 'alphabetical', // Fallback configuration
        },
      ],
    },
  },

  {
    plugins: {
      boundaries,
    },
    settings: {
      ...eslintImportResolverSettings,
      'boundaries/include': ['packages/app/src/**/*.ts', 'packages/app/src/**/*.vue'],
      'boundaries/ignore': ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**'],
      'boundaries/files': [
        {
          category: 'app-root',
          pattern: 'packages/app/src/App.vue',
        },
        {
          category: 'main',
          pattern: 'packages/app/src/createMarkdownStudioApp.ts',
        },
      ],
      'boundaries/elements': [
        {
          type: 'feature-component',
          pattern: 'packages/app/src/features/*/components/**',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'feature-composable',
          pattern: 'packages/app/src/features/*/composables/**',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'feature-store',
          pattern: 'packages/app/src/features/*/store/**',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'feature-service',
          pattern: 'packages/app/src/features/*/services/**',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'feature-type',
          pattern: 'packages/app/src/features/*/types/**',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'feature',
          pattern: 'packages/app/src/features/*/**',
          capture: ['feature'],
          partialMatch: false,
        },
        {
          type: 'view',
          pattern: 'packages/app/src/views/**',
          partialMatch: false,
        },
        {
          type: 'layout',
          pattern: 'packages/app/src/layouts/**',
          partialMatch: false,
        },
        {
          type: 'router',
          pattern: 'packages/app/src/router/**',
          partialMatch: false,
        },
        {
          type: 'ui-base',
          pattern: 'packages/app/src/components/base/**',
          partialMatch: false,
        },
        {
          type: 'ui-icons',
          pattern: 'packages/app/src/components/icons/**',
          partialMatch: false,
        },
        {
          type: 'ui',
          pattern: 'packages/app/src/components/**',
          partialMatch: false,
        },
        {
          type: 'global-store',
          pattern: 'packages/app/src/stores/**',
          partialMatch: false,
        },
        {
          type: 'global-service',
          pattern: 'packages/app/src/services/**',
          partialMatch: false,
        },
        {
          type: 'utils',
          pattern: 'packages/app/src/utils/**',
          partialMatch: false,
        },
        {
          type: 'global-composable',
          pattern: 'packages/app/src/composables/**',
          partialMatch: false,
        },
        {
          type: 'types',
          pattern: 'packages/app/src/types/**',
          partialMatch: false,
        },
        {
          type: 'styles',
          pattern: 'packages/app/src/styles/**',
          partialMatch: false,
        },
        {
          type: 'assets',
          pattern: 'packages/app/src/assets/**',
          partialMatch: false,
        },
        {
          type: 'app-config',
          pattern: 'packages/app/src/app/config/**',
          partialMatch: false,
        },
        {
          type: 'app-plugin',
          pattern: 'packages/app/src/app/plugins/**',
          partialMatch: false,
        },
        {
          type: 'app-provider',
          pattern: 'packages/app/src/app/providers/**',
          partialMatch: false,
        },
        {
          type: 'app',
          pattern: 'packages/app/src/app/**',
          partialMatch: false,
        },
      ],
    } satisfies Settings,

    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          checkAllOrigins: true,
          policies: [
            {
              from: { element: { type: featureTypes } },
              disallow: [{ to: differentFeatureSelector(featureTypes) }],
              message:
                '🚫 Cross-feature import detected! "{{from.element.types.[0]}}" in "{{from.element.captured.feature}}" cannot import from "{{to.element.captured.feature}}". Features must be isolated. Use global stores or events for cross-feature communication.',
            },
            {
              from: { element: { type: 'view' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [...globalLayerTypes, ...appTypes, 'feature-store', 'feature-service'],
                    },
                  },
                },
              ],
              message:
                '🚫 Views are orchestration layers. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Use feature composables or components instead of accessing stores/services directly.',
            },
            {
              from: { element: { type: 'layout' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [...featureTypes, ...globalLayerTypes, ...structuralTypes, ...appTypes],
                    },
                  },
                },
              ],
              message:
                '🚫 Layouts define page structure only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". No features or business logic allowed in layouts.',
            },
            {
              from: { element: { type: uiTypes } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [...featureTypes, ...globalLayerTypes, ...structuralTypes, ...appTypes],
                    },
                  },
                },
              ],
              message:
                '🚫 UI components must be pure and reusable. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". No features, stores, or services allowed. Use props and events instead.',
            },
            {
              from: { element: { type: 'global-store' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [...featureTypes, ...uiTypes, ...structuralTypes, ...appTypes],
                    },
                  },
                },
              ],
              message:
                '🚫 Global stores handle cross-cutting concerns. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Global stores cannot depend on features or UI.',
            },
            {
              from: { element: { type: 'global-service' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        ...featureTypes,
                        'global-store',
                        ...uiTypes,
                        ...structuralTypes,
                        ...appTypes,
                      ],
                    },
                  },
                },
              ],
              message:
                '🚫 Global services are infrastructure. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Services should be pure and not depend on state or UI.',
            },
            {
              from: { element: { type: 'global-composable' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [...featureTypes, ...uiTypes, ...structuralTypes, ...appTypes],
                    },
                  },
                },
              ],
              message:
                '🚫 Global composables must stay generic. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Use composables for shared logic only.',
            },
            {
              from: { element: { type: 'utils' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        ...featureTypes,
                        ...globalLayerTypes,
                        ...uiTypes,
                        ...structuralTypes,
                        ...appTypes,
                        'styles',
                        'assets',
                      ],
                    },
                  },
                },
              ],
              message:
                '🚫 Utils must be pure functions. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Utils should have no side effects and no dependencies on application layers.',
            },
            {
              from: { element: { type: 'types' } },
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        ...featureTypes,
                        ...globalLayerTypes,
                        ...uiTypes,
                        ...structuralTypes,
                        ...appTypes,
                        'utils',
                        'styles',
                        'assets',
                      ],
                    },
                  },
                },
              ],
              message:
                '🚫 Types are compile-time only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Types can only reference other types.',
            },
            {
              from: { element: { type: 'feature-component' } },
              disallow: [
                { to: sameFeatureSelector('feature-service') },
                { to: { element: { type: ['global-service', ...structuralTypes, ...appTypes] } } },
              ],
              message:
                '🚫 Feature components cannot call services directly. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Use composables to access services.',
            },
            {
              from: { element: { type: 'feature-store' } },
              disallow: [
                { to: sameFeatureSelector('feature-component') },
                { to: { element: { type: [...structuralTypes, ...uiTypes, ...appTypes] } } },
              ],
              message:
                '🚫 Feature stores manage state only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Stores should not depend on components or composables.',
            },
            {
              from: { element: { type: 'feature-service' } },
              disallow: [
                {
                  to: sameFeatureSelector([
                    'feature-component',
                    'feature-composable',
                    'feature-store',
                  ]),
                },
                {
                  to: {
                    element: {
                      type: ['global-store', ...uiTypes, ...structuralTypes, ...appTypes],
                    },
                  },
                },
              ],
              message:
                '🚫 Feature services handle API calls only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Services should be stateless and not depend on stores or UI.',
            },
            {
              from: { element: { type: 'feature-type' } },
              disallow: [
                {
                  to: sameFeatureSelector([
                    'feature-component',
                    'feature-composable',
                    'feature-store',
                    'feature-service',
                  ]),
                },
                {
                  to: {
                    element: {
                      type: [
                        ...globalLayerTypes,
                        ...uiTypes,
                        ...structuralTypes,
                        ...appTypes,
                        'utils',
                        'styles',
                        'assets',
                      ],
                    },
                  },
                },
              ],
              message:
                '🚫 Feature types are compile-time only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Feature types can only extend shared types.',
            },
            {
              from: { element: { type: 'router' } },
              disallow: [{ to: { element: { type: [...featureTypes, ...uiTypes, ...appTypes] } } }],
              message:
                '🚫 Router defines routes only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Router can reference views and layouts, not features directly.',
            },
            {
              from: { file: { categories: ['app-root', 'main'] } },
              disallow: [
                { to: { element: { type: [...featureTypes, ...globalLayerTypes, 'view'] } } },
              ],
              message:
                '🚫 App entry points must stay lean. "{{from.file.categories}}" cannot import "{{to.element.types.[0]}}". Keep bootstrapping minimal and delegate to app layer.',
            },
            {
              from: { element: { type: uiTypes } },
              disallow: [
                {
                  to: {
                    module: {
                      origin: ['external', 'core'],
                      source: ['pinia', 'vue-router'],
                    },
                  },
                },
              ],
              message: '🚫 UI components must be pure. Use composables for state and routing.',
            },
            {
              from: { element: { type: 'utils' } },
              disallow: [
                {
                  to: {
                    module: {
                      origin: ['external', 'core'],
                      source: ['vue', 'pinia', 'vue-router'],
                    },
                  },
                },
              ],
              message:
                '🚫 Utils must be pure TypeScript. No Vue reactivity or framework dependencies.',
            },
            {
              from: { element: { type: 'types' } },
              disallow: [
                {
                  to: {
                    module: {
                      origin: ['external', 'core'],
                      source: ['vue', 'pinia', 'vue-router'],
                    },
                  },
                },
              ],
              message: '🚫 Types are compile-time only. No runtime dependencies allowed.',
            },
          ],
        },
      ],
    },
  } satisfies Config,

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
