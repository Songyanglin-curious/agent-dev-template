/**
 * 强制 Agent Note 的头部、各生命周期专属章节、备选方案以及已废弃标记规则。
 * 分类与文件名由同级的目录树门禁负责；归档记录还需附加归档日期行，
 * 由归档门禁校验。确切的格式与祖父条款规则位于
 * `.agents/notes/README.md`。
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { agentNoteRoot, walkAgentNoteTree } from './agent-note-tree.ts'

/** 这些格式规则的生效日期；祖父注释仅在该日期之前有效。 */
const FORMAT_ADOPTED = '2026-07-05'

/** 格式生效前的 Agent Note 用它替代 `## Alternatives considered` 的确切注释。 */
const GRANDFATHER = '<!-- agent-note-format: alternatives-not-recorded (pre-format Agent Note) -->'

/** 曾用于标记格式前正文的已废弃债务标记；现已禁用，防止它重新出现。 */
const LEGACY_MARKERS = ['XXX: legacy ADR/RFC body format', 'XXX: legacy ADR/Agent Note body format']

/** 各生命周期目录对应的 Status 行文法。 */
const STATUS: Record<string, RegExp> = {
  proposed: /^Status: proposed$/,
  implemented: /^Status: implemented$/,
  rejected: /^Status: rejected — .+$/,
}

/** 各生命周期除通用 `## Problem` 开头外必需的 `##` 标题。 */
const REQUIRED: Record<string, string[]> = {
  proposed: ['## Proposal', '## Acceptance criteria', '## Risks'],
  implemented: ['## Decision', '## Consequences'],
  rejected: ['## Proposal'],
}

/** 在 `implemented/` 中禁止的标题——按废话清单属于提案期的规格腔。 */
const BANNED_IMPLEMENTED = /^## (?:Proposal\b|Plan\b|Migration plan\b|Acceptance criteria\b)/i

const { notes, errors } = walkAgentNoteTree()

for (const note of notes) {
  const fail = (msg: string): void => {
    errors.push(`format: ${note.rel} — ${msg}`)
  }
  const text = readFileSync(resolve(agentNoteRoot, note.rel), 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  // 围栏示例内部的格式标记不属于文档结构。
  let inFence = false
  const prose = lines.filter((l) => {
    if (l.startsWith('```')) {
      inFence = !inFence
      return false
    }
    return !inFence
  })

  if (!/^# Agent Note: \S/.test(lines[0] ?? '')) fail('line 1 must be `# Agent Note: <title>`')
  if (lines[1] !== '') fail('line 2 must be blank')
  const status = STATUS[note.lifecycle]
  if (status !== undefined && !status.test(lines[2] ?? '')) {
    fail(`line 3 must match the ${note.lifecycle} status grammar (${String(status)})`)
  }
  if (lines[3] !== '') fail('line 4 must be blank')
  const statusLines = prose.filter(l => l.startsWith('Status:') && l !== lines[2])
  if (statusLines.length > 0 || prose.filter(l => l === lines[2]).length > 1) {
    fail('the line-3 `Status:` line must be the only one in the file')
  }

  const h2s = prose.filter(l => l.startsWith('## ')).map(l => l.trimEnd())
  if (h2s[0] !== '## Problem') fail(`the first section must be \`## Problem\` (got ${JSON.stringify(h2s[0] ?? '<none>')})`)
  for (const required of REQUIRED[note.lifecycle] ?? []) {
    if (!h2s.includes(required)) fail(`missing the required \`${required}\` section`)
  }
  if (note.lifecycle === 'implemented') {
    for (const h2 of h2s.filter(h => BANNED_IMPLEMENTED.test(h))) {
      fail(`\`${h2}\` is a proposal-era heading; an implemented Agent Note states what is (fold it into Decision/Consequences/Testing)`)
    }
  }

  const hasSection = h2s.includes('## Alternatives considered')
  const hasGrandfather = prose.includes(GRANDFATHER)
  if (hasSection && hasGrandfather) fail('carries both `## Alternatives considered` and the grandfather comment — drop the comment')
  if (!hasSection && !hasGrandfather) fail('missing `## Alternatives considered` (a pre-format Agent Note whose alternatives are not reconstructible carries the grandfather comment instead — see .agents/notes/README.md § The file format)')
  if (hasGrandfather && note.date >= FORMAT_ADOPTED) fail(`the grandfather comment is only valid for Agent Notes dated before ${FORMAT_ADOPTED}`)

  if (prose.some(line => LEGACY_MARKERS.some(marker => line.includes(marker)))) fail('carries the retired legacy-format debt marker')
}

if (errors.length === 0) {
  console.log(`verify-agent-note-format: ${notes.length} Agent Note(s) checked, all conform to .agents/notes/README.md § The file format.`)
  process.exit(0)
}

console.error('verify-agent-note-format: violations found:')
for (const e of errors) console.error(`  ${e}`)
process.exit(1)
