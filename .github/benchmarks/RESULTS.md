# Oxlint JavaScript plugin benchmark

Date: 2026-10-20

## Scope

The benchmark measures the wall-clock time of `vp lint`, not full CI runtime.

All cases use the same checkout and GitHub-hosted Ubuntu 24.04 runner, with these variations:

- **Baseline:** original root `vite.config.ts`.
- **Without Perfectionist:** remove `eslint-plugin-perfectionist` and all 21 enabled `perfectionist/*` rules.
- **Without Boundaries:** remove `eslint-plugin-boundaries` and `boundaries/dependencies`. The unused `boundaries/*` settings remain in the config.
- **Without both:** remove both plugins and their rules.

The benchmark harness file is ignored by the lint command, so the original project source is checked.

Each case uses a fresh `vp lint` process. One warm-up and five measured executions are run per case; order rotates between rounds. The script restores `vite.config.ts` after the test, including if a lint command fails.

## Results

Run: https://github.com/theoklitosBam7/markdown-studio/actions/runs/39472451853

| Case | Mean (s) | Median (s) | Min–max (s) | Median time saved |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 1.954 | 1.949 | 1.920–2.010 | — |
| Without Perfectionist | 1.229 | 1.235 | 1.201–1.248 | 36.6% |
| Without Boundaries | 1.299 | 1.300 | 1.286–1.320 | 33.3% |
| Without both | 0.564 | 0.565 | 0.553–0.574 | 71.0% |

Raw measured samples (seconds):

- Baseline: 1.949, 1.920, 1.927, 1.963, 2.010
- Without Perfectionist: 1.245, 1.218, 1.248, 1.201, 1.235
- Without Boundaries: 1.286, 1.320, 1.290, 1.300, 1.300
- Without both: 0.559, 0.567, 0.565, 0.574, 0.553

Independent preceding three-case run: https://github.com/theoklitosBam7/markdown-studio/actions/runs/39472190279

| Case | Median (s) | Median time saved |
| --- | ---: | ---: |
| Baseline | 1.724 | — |
| Without Perfectionist | 1.111 | 35.5% |
| Without Boundaries | 1.161 | 32.6% |

## Toolchain

- Vite+ 1.1.0
- Oxlint 1.87.0
- Node.js 24.21.0
- Ubuntu 24.04 GitHub Actions runner
- `typeAware: false`, `typeCheck: false`

## Reproduce

With dependencies installed, run this command from the repository root on this branch:

```bash
node .github/benchmarks/lint-plugins.mjs
```

Use `BENCHMARK_ROUNDS=10` to collect ten measured runs per case.

## Interpretation

Perfectionist and Boundaries both add meaningful time to `vp lint` in this CI environment. Removing both cuts its median runtime by 71%. This does **not** imply the same reduction to the complete CI workflow: dependency installation, formatting, TypeScript checks, and tests remain separate costs.

Recommended initial optimization: retain the Boundaries architectural rule, but consider whether every Perfectionist sorting rule must run in CI. Removing Perfectionist alone reduced lint time by about 36% in two separate runs. If you choose to replace some sorting checks with Oxfmt, validate behavior first, since import sorting does not cover all Perfectionist rules.

Results apply to this runner and repository revision. They do not establish equivalent speedups on local macOS hardware. Neither disabled-plugin variant checks the removed rules.
