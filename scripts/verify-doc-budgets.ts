/**
 * Enforce documentation ceilings from `scripts/doc-budgets.manifest.json`.
 * Missing files and invalid ceilings fail; `--list` reports current usage.
 * Counting rule: every CJK Han, kana, or hangul character counts as one unit;
 * all other text counts one unit per whitespace-delimited token, with each CJK
 * character acting as a separator between adjacent non-CJK tokens. This keeps
 * dense CJK prose comparable to `wc -w` on Latin prose instead of counting a
 * whole paragraph as one word. Only listed standing docs are budgeted;
 * ceilings keep headroom over the current count.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { countDocumentUnits } from './doc-units.ts'

const root = resolve(import.meta.dirname, '..')

const MANIFEST_PATH = resolve(root, 'scripts/doc-budgets.manifest.json')

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Record<string, number>

const listOnly = process.argv.includes('--list')
const failures: string[] = []
const rows: string[] = []

for (const [path, ceiling] of Object.entries(manifest)) {
  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    rows.push(`BAD   ${'—'.padStart(6)} / ${String(ceiling).padEnd(6)} ${path}`)
    failures.push(`${path}: ceiling must be a positive integer, got ${ceiling}`)
    continue
  }
  const abs = resolve(root, path)
  if (!existsSync(abs)) {
    rows.push(`MISS  ${'—'.padStart(6)} / ${String(ceiling).padEnd(6)} ${path}`)
    failures.push(`${path}: budgeted file does not exist (renamed or deleted? update scripts/doc-budgets.manifest.json in the same change)`)
    continue
  }
  const units = countDocumentUnits(readFileSync(abs, 'utf8'))
  rows.push(`${units <= ceiling ? 'ok  ' : 'OVER'}  ${String(units).padStart(6)} / ${String(ceiling).padEnd(6)} ${path}`)
  if (units > ceiling) {
    failures.push(`${path}: ${units} units exceeds the ${ceiling}-unit ceiling (each CJK Han/kana/hangul character counts 1; other text counts 1 per whitespace-delimited token) — relocate or condense, and raising the ceiling requires justification in the change`)
  }
}

if (listOnly) {
  console.log(rows.join('\n'))
  process.exit(0)
}

if (failures.length > 0) {
  console.error('verify-doc-budgets failed:\n')
  for (const failure of failures) console.error(`  ${failure}`)
  console.error('\nCounting rule: CJK Han/kana/hangul characters count 1 each; all other text counts 1 per whitespace-delimited token.')
  process.exit(1)
}

console.log(`verify-doc-budgets: ${Object.keys(manifest).length} budgeted docs within ceiling.`)
