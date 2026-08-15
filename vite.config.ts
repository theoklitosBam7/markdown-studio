import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))
const packageRoot = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

export default defineConfig({
  fmt: {
    embeddedLanguageFormatting: 'auto',
    ignorePatterns: ['.changeset/**', '**/CHANGELOG.md'],
    semi: false,
    singleQuote: true,
  },
  lint: {
    categories: {
      correctness: 'error',
    },
    env: {
      browser: true,
      builtin: true,
    },
    ignorePatterns: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/out/**',
      '**/release/**',
      '**/coverage/**',
      'packages/cli/public/**',
      '**/node_modules/**',
    ],
    jsPlugins: [
      'eslint-plugin-perfectionist',
      'eslint-plugin-boundaries',
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    options: {
      // The previous ESLint setup used non-type-checked recommended presets
      // (`vueTsConfigs.recommended`); type safety is enforced by `vue-tsc --build`.
      typeAware: false,
      typeCheck: false,
    },
    overrides: [
      {
        files: ['cypress/**/*'],
        rules: {
          'vitest/valid-expect': 'off',
        },
      },
      {
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts', '**/*.vue'],
        rules: {
          'constructor-super': 'off',
          'getter-return': 'off',
          'no-class-assign': 'off',
          'no-const-assign': 'off',
          'no-dupe-class-members': 'off',
          'no-dupe-keys': 'off',
          'no-func-assign': 'off',
          'no-import-assign': 'off',
          'no-new-native-nonconstructor': 'off',
          'no-obj-calls': 'off',
          'no-redeclare': 'off',
          'no-setter-return': 'off',
          'no-this-before-super': 'off',
          'no-undef': 'off',
          'no-unreachable': 'off',
          'no-unsafe-negation': 'off',
          'no-var': 'error',
          'no-with': 'off',
          'prefer-const': 'error',
          'prefer-rest-params': 'error',
          'prefer-spread': 'error',
        },
      },
      {
        env: {
          mocha: true,
        },
        files: [
          'cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',
          'cypress/support/**/*.{js,ts,jsx,tsx}',
        ],
        globals: {
          assert: 'readonly',
          AsyncDisposableStack: 'readonly',
          chai: 'readonly',
          cy: 'readonly',
          Cypress: 'readonly',
          DisposableStack: 'readonly',
          expect: 'readonly',
          SuppressedError: 'readonly',
        },
        jsPlugins: ['eslint-plugin-cypress'],
        rules: {
          'cypress/no-assigning-return-values': 'error',
          'cypress/no-async-tests': 'error',
          'cypress/no-unnecessary-waiting': 'error',
          'cypress/unsafe-to-chain-command': 'error',
        },
      },
      {
        files: ['apps/**/__tests__/*', 'packages/**/__tests__/*'],
        rules: {
          'vitest/expect-expect': 'error',
          'vitest/no-commented-out-tests': 'error',
          'vitest/no-conditional-expect': 'error',
          'vitest/no-disabled-tests': 'warn',
          'vitest/no-focused-tests': 'error',
          'vitest/no-identical-title': 'error',
          'vitest/no-import-node-test': 'error',
          'vitest/no-interpolation-in-snapshots': 'error',
          'vitest/no-mocks-import': 'error',
          'vitest/no-standalone-expect': 'error',
          'vitest/no-unneeded-async-expect-function': 'error',
          'vitest/prefer-called-exactly-once-with': 'error',
          'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
          'vitest/valid-describe-callback': 'error',
          'vitest/valid-expect': 'error',
          'vitest/valid-expect-in-promise': 'error',
          'vitest/valid-title': 'error',
        },
      },
    ],
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'vue', 'vitest'],
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          checkAllOrigins: true,
          default: 'allow',
          policies: [
            {
              disallow: [
                {
                  to: {
                    element: {
                      captured: {
                        feature: '!{{from.element.captured.feature}}',
                      },
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: [
                    'feature',
                    'feature-component',
                    'feature-composable',
                    'feature-store',
                    'feature-service',
                    'feature-type',
                  ],
                },
              },
              message:
                '🚫 Cross-feature import detected! "{{from.element.types.[0]}}" in "{{from.element.captured.feature}}" cannot import from "{{to.element.captured.feature}}". Features must be isolated. Use global stores or events for cross-feature communication.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'global-store',
                        'global-service',
                        'global-composable',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                        'feature-store',
                        'feature-service',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'view',
                },
              },
              message:
                '🚫 Views are orchestration layers. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Use feature composables or components instead of accessing stores/services directly.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'global-store',
                        'global-service',
                        'global-composable',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'layout',
                },
              },
              message:
                '🚫 Layouts define page structure only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". No features or business logic allowed in layouts.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'global-store',
                        'global-service',
                        'global-composable',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: ['ui', 'ui-base', 'ui-icons'],
                },
              },
              message:
                '🚫 UI components must be pure and reusable. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". No features, stores, or services allowed. Use props and events instead.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'global-store',
                },
              },
              message:
                '🚫 Global stores handle cross-cutting concerns. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Global stores cannot depend on features or UI.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'global-store',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'global-service',
                },
              },
              message:
                '🚫 Global services are infrastructure. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Services should be pure and not depend on state or UI.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'global-composable',
                },
              },
              message:
                '🚫 Global composables must stay generic. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Use composables for shared logic only.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'global-store',
                        'global-service',
                        'global-composable',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                        'styles',
                        'assets',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'utils',
                },
              },
              message:
                '🚫 Utils must be pure functions. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Utils should have no side effects and no dependencies on application layers.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'global-store',
                        'global-service',
                        'global-composable',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                        'utils',
                        'styles',
                        'assets',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'types',
                },
              },
              message:
                '🚫 Types are compile-time only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Types can only reference other types.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      captured: {
                        feature: '{{from.element.captured.feature}}',
                      },
                      type: 'feature-service',
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: [
                        'global-service',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'feature-component',
                },
              },
              message:
                '🚫 Feature components cannot call services directly. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Use composables to access services.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      captured: {
                        feature: '{{from.element.captured.feature}}',
                      },
                      type: 'feature-component',
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: [
                        'view',
                        'layout',
                        'router',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'feature-store',
                },
              },
              message:
                '🚫 Feature stores manage state only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Stores should not depend on components or composables.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      captured: {
                        feature: '{{from.element.captured.feature}}',
                      },
                      type: ['feature-component', 'feature-composable', 'feature-store'],
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: [
                        'global-store',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'feature-service',
                },
              },
              message:
                '🚫 Feature services handle API calls only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Services should be stateless and not depend on stores or UI.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      captured: {
                        feature: '{{from.element.captured.feature}}',
                      },
                      type: [
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                      ],
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: [
                        'global-store',
                        'global-service',
                        'global-composable',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'view',
                        'layout',
                        'router',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                        'utils',
                        'styles',
                        'assets',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'feature-type',
                },
              },
              message:
                '🚫 Feature types are compile-time only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Feature types can only extend shared types.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'ui',
                        'ui-base',
                        'ui-icons',
                        'app',
                        'app-config',
                        'app-plugin',
                        'app-provider',
                      ],
                    },
                  },
                },
              ],
              from: {
                element: {
                  type: 'router',
                },
              },
              message:
                '🚫 Router defines routes only. "{{from.element.types.[0]}}" cannot import "{{to.element.types.[0]}}". Router can reference views and layouts, not features directly.',
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: [
                        'feature',
                        'feature-component',
                        'feature-composable',
                        'feature-store',
                        'feature-service',
                        'feature-type',
                        'global-store',
                        'global-service',
                        'global-composable',
                        'view',
                      ],
                    },
                  },
                },
              ],
              from: {
                file: {
                  categories: ['app-root', 'main'],
                },
              },
              message:
                '🚫 App entry points must stay lean. "{{from.file.categories}}" cannot import "{{to.element.types.[0]}}". Keep bootstrapping minimal and delegate to app layer.',
            },
            {
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
              from: {
                element: {
                  type: ['ui', 'ui-base', 'ui-icons'],
                },
              },
              message: '🚫 UI components must be pure. Use composables for state and routing.',
            },
            {
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
              from: {
                element: {
                  type: 'utils',
                },
              },
              message:
                '🚫 Utils must be pure TypeScript. No Vue reactivity or framework dependencies.',
            },
            {
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
              from: {
                element: {
                  type: 'types',
                },
              },
              message: '🚫 Types are compile-time only. No runtime dependencies allowed.',
            },
          ],
        },
      ],
      'no-array-constructor': 'error',
      'perfectionist/sort-array-includes': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-classes': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-decorators': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-enums': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-export-attributes': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-exports': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-heritage-clauses': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-import-attributes': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-interfaces': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-intersection-types': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-jsx-props': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-maps': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-modules': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-named-exports': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-object-types': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-objects': [
        'error',
        {
          type: 'unsorted',
          useConfigurationIf: {
            declarationCommentMatchesPattern: {
              pattern: '^do not sort$',
              scope: 'deep',
            },
          },
        },
        {
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-sets': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-switch-case': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-union-types': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-variable-declarations': [
        'error',
        {
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'typescript/ban-ts-comment': 'error',
      'typescript/no-empty-object-type': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-namespace': 'error',
      'typescript/no-require-imports': 'error',
      'typescript/no-unnecessary-type-constraint': 'error',
      'typescript/no-unsafe-function-type': 'error',
      'vite-plus/prefer-vite-plus-imports': 'error',
      'vitest/require-mock-type-parameters': 'off',
      'vue/component-definition-name-casing': 'warn',
      'vue/no-multiple-slot-args': 'warn',
      'vue/no-required-prop-with-default': 'warn',
      'vue/prop-name-casing': 'warn',
      'vue/require-default-prop': 'warn',
      'vue/require-prop-types': 'warn',
    },
    settings: {
      'boundaries/elements': [
        {
          capture: ['feature'],
          partialMatch: false,
          pattern: 'packages/app/src/features/*/components/**',
          type: 'feature-component',
        },
        {
          capture: ['feature'],
          partialMatch: false,
          pattern: 'packages/app/src/features/*/composables/**',
          type: 'feature-composable',
        },
        {
          capture: ['feature'],
          partialMatch: false,
          pattern: 'packages/app/src/features/*/store/**',
          type: 'feature-store',
        },
        {
          capture: ['feature'],
          partialMatch: false,
          pattern: 'packages/app/src/features/*/services/**',
          type: 'feature-service',
        },
        {
          capture: ['feature'],
          partialMatch: false,
          pattern: 'packages/app/src/features/*/types/**',
          type: 'feature-type',
        },
        {
          capture: ['feature'],
          partialMatch: false,
          pattern: 'packages/app/src/features/*/**',
          type: 'feature',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/views/**',
          type: 'view',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/layouts/**',
          type: 'layout',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/router/**',
          type: 'router',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/components/base/**',
          type: 'ui-base',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/components/icons/**',
          type: 'ui-icons',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/components/**',
          type: 'ui',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/stores/**',
          type: 'global-store',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/services/**',
          type: 'global-service',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/utils/**',
          type: 'utils',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/composables/**',
          type: 'global-composable',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/types/**',
          type: 'types',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/styles/**',
          type: 'styles',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/assets/**',
          type: 'assets',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/app/config/**',
          type: 'app-config',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/app/plugins/**',
          type: 'app-plugin',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/app/providers/**',
          type: 'app-provider',
        },
        {
          partialMatch: false,
          pattern: 'packages/app/src/app/**',
          type: 'app',
        },
      ],
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
      'boundaries/ignore': ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**'],
      'boundaries/include': ['packages/app/src/**/*.ts', 'packages/app/src/**/*.vue'],
    },
  },
  // Root-level `vp test` runs each workspace package as a project so per-package
  // configs (aliases, jsdom, plugins) stay close to their source. It mirrors
  // `vp run -r test` without spawning one Vitest process per package.
  // Absolute paths keep resolution stable regardless of the invoking cwd.
  test: {
    projects: [
      {
        extends: packageRoot('./packages/app/vite.config.ts'),
        test: {
          environment: 'jsdom',
          include: ['src/**/__tests__/**/*.spec.ts'],
          name: 'app',
          root: packageRoot('./packages/app'),
        },
      },
      {
        test: {
          environment: 'node',
          include: ['src/__tests__/**/*.spec.ts'],
          name: 'cli',
          root: packageRoot('./packages/cli'),
        },
      },
      {
        test: {
          environment: 'node',
          include: ['__tests__/**/*.spec.ts'],
          name: 'desktop-contract',
          root: packageRoot('./packages/desktop-contract'),
        },
      },
      {
        test: {
          environment: 'node',
          include: ['electron/**/*.spec.ts'],
          name: 'desktop',
          root: packageRoot('./apps/desktop'),
        },
      },
      {
        test: {
          environment: 'node',
          include: ['scripts/**/*.spec.mjs'],
          name: 'scripts',
          root: workspaceRoot,
        },
      },
    ],
  },
})
