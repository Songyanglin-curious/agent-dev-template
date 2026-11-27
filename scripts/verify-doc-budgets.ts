/**
 * 依据 `scripts/doc-budgets.manifest.json` 强制执行文档上限。
 * 文件缺失或上限非法都会失败；`--list` 报告当前用量。
 * 计数规则：每个 CJK 汉字、假名或谚文字符计为一个单位；
 * 其他文本按空白分隔的 token 每个计一个单位，其中每个 CJK
 * 字符充当相邻非 CJK token 之间的分隔符。这样密集的中文
 * 正文与拉丁文正文的 `wc -w` 计数可比，而不是把整段
 * 文字当作一个词。只有清单中列出的常设文档纳入预算；
 * 上限相对当前计数保留余量。
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
