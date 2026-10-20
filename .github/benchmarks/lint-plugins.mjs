import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const configPath = fileURLToPath(new URL('../../vite.config.ts', import.meta.url))
const original = readFileSync(configPath, 'utf8')
const warmupRounds = 1
const measuredRounds = Number(process.env.BENCHMARK_ROUNDS ?? 5)

if (!Number.isInteger(measuredRounds) || measuredRounds < 1) {
  throw new Error('BENCHMARK_ROUNDS must be a positive integer')
}

function removePlugin(source, pluginEntry, rulesStart, followingRule) {
  if (!source.includes(pluginEntry)) {
    throw new Error('Expected plugin entry not found: ' + pluginEntry.trim())
  }

  const ruleStart = source.indexOf(rulesStart)
  const ruleEnd = source.indexOf(followingRule, ruleStart)

  if (ruleStart < 0 || ruleEnd < 0 || ruleEnd <= ruleStart) {
    throw new Error('Could not isolate rule block: ' + rulesStart.trim())
  }

  const withoutEntry = source.replace(pluginEntry, '')
  const shift = pluginEntry.length
  return withoutEntry.slice(0, ruleStart - shift) + withoutEntry.slice(ruleEnd - shift)
}

const cases = [
  {
    name: 'baseline',
    config: original,
  },
  {
    name: 'without-perfectionist',
    config: removePlugin(
      original,
      "      'eslint-plugin-perfectionist',\n",
      "      'perfectionist/sort-array-includes': [",
      "      'typescript/ban-ts-comment': 'error',",
    ),
  },
  {
    name: 'without-boundaries',
    config: removePlugin(
      original,
      "      'eslint-plugin-boundaries',\n",
      "      'boundaries/dependencies': [",
      "      'no-array-constructor': 'error',",
    ),
  },
]

for (const variant of cases.slice(1)) {
  if (variant.config === original || !variant.config.includes('no-array-constructor')) {
    throw new Error('Invalid benchmark configuration: ' + variant.name)
  }
}

const measurements = Object.fromEntries(cases.map(({ name }) => [name, []]))

function runLint(variant) {
  writeFileSync(configPath, variant.config)
  const start = performance.now()
  const result = spawnSync('vp', ['lint'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  const seconds = (performance.now() - start) / 1000

  if (result.error || result.status !== 0) {
    console.error(result.stdout ?? '')
    console.error(result.stderr ?? '')
    throw new Error(
      variant.name + ' failed with exit code ' + result.status +
      (result.error ? ': ' + result.error.message : ''),
    )
  }

  return seconds
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

try {
  for (let round = 0; round < warmupRounds + measuredRounds; round++) {
    const ordered = cases.map((_, index) => cases[(index + round) % cases.length])
    for (const variant of ordered) {
      const seconds = runLint(variant)
      const warmup = round < warmupRounds
      if (!warmup) {
        measurements[variant.name].push(seconds)
      }
      console.log(
        (warmup ? 'WARMUP ' : 'MEASURE ') +
        'round=' + (round + 1) +
        ' variant=' + variant.name +
        ' seconds=' + seconds.toFixed(3),
      )
    }
  }
} finally {
  writeFileSync(configPath, original)
}

const baselineMedian = median(measurements.baseline)
const results = cases.map(({ name }) => {
  const values = measurements[name]
  const medianSeconds = median(values)
  return {
    variant: name,
    runs: values.length,
    meanSeconds: Number(mean(values).toFixed(3)),
    medianSeconds: Number(medianSeconds.toFixed(3)),
    minimumSeconds: Number(Math.min(...values).toFixed(3)),
    maximumSeconds: Number(Math.max(...values).toFixed(3)),
    savedPercent: Number(((baselineMedian - medianSeconds) / baselineMedian * 100).toFixed(1)),
    samplesSeconds: values.map(value => Number(value.toFixed(3))),
  }
})

console.log('\nLINT_BENCHMARK_RESULTS=' + JSON.stringify(results))

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## Oxlint JavaScript plugin benchmark',
    '',
    'Same source files, runner, and rule configuration except for the named plugin and its rules.',
    'Five measured runs per case, one warmup per case; alternating execution order.',
    '',
    '| Configuration | Median (s) | Mean (s) | Min–max (s) | Median time saved |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...results.map(row =>
      '| ' + row.variant + ' | ' + row.medianSeconds +
      ' | ' + row.meanSeconds + ' | ' +
      row.minimumSeconds + '–' + row.maximumSeconds + ' | ' +
      row.savedPercent + '% |',
    ),
    '',
    'Negative time savings mean the variant was slower than the baseline.',
    'Each test starts a fresh vp lint process. The original config is restored between tests.',
    '',
    String.fromCharCode(96).repeat(3) + 'json',
    JSON.stringify(results, null, 2),
    String.fromCharCode(96).repeat(3),
  ]

  writeFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
}
