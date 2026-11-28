/**
 * 强制 Agent Note 的生命周期/类别路径与带日期文件名。结构规则与
 * `agent-note-tree.ts` 共用；封闭的分类规则位于
 * `.agents/notes/README.md`。
 */

import { walkAgentNoteTree } from './agent-note-tree.ts'

const { notes, errors } = walkAgentNoteTree()

if (errors.length === 0) {
  console.log(`verify-agent-note-classification: ${notes.length} Agent Note(s) checked, structure consistent.`)
  process.exit(0)
}

console.error('verify-agent-note-classification: violations found:')
for (const e of errors) console.error(`  ${e}`)
process.exit(1)
