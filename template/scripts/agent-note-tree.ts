/**
 * Agent Note 目录树共享的结构事实来源。生命周期与类别集合由
 * `.agents/notes/README.md` 封闭定义；导入本模块不产生副作用。
 */

import { globSync, readdirSync } from 'node:fs'
import { resolve, sep } from 'node:path'

export const agentNoteRoot = resolve(import.meta.dirname, '../.agents/notes')

/** 当前启用的 Agent Note 生命周期闭集（.agents/notes/ 下的一级目录）。 */
const AGENT_NOTE_LIFECYCLES = ['proposed', 'implemented', 'rejected'] as const

/**
 * Agent Note 类别闭集（每个生命周期下的嵌套目录）。新增类别是有意为之的
 * 变动：必须同时扩展本列表与 README 的 Classification 一节。
 * 门禁会拒绝任何未在此列出的目录。
 */
export const AGENT_NOTE_CLASSES = ['feature', 'bug-fix', 'simplification', 'architecture', 'process', 'testing'] as const

/** 历史上的已实现 Note 存放在活动生命周期目录树之外。 */
const AGENT_NOTE_ARCHIVE = 'archived'

/** 允许直接放在生命周期根目录下的非 Agent Note Markdown 文件。 */
const ROOT_ALLOWLIST = new Set(['AGENTS.md'])

/** 遍历器发现的一个 Agent Note 文件。 */
export interface AgentNote {
  lifecycle: string
  /** 相对于 .agents/notes 的路径。 */
  rel: string
}

/**
 * 遍历 Agent Note 目录树并执行结构规则。返回所有合法的 Agent Note，
 * 以及每处违规对应的一条错误信息（未知的生命周期或类别目录、
 * 层级深度错误、文件名错误）。调用方把非空错误列表视为致命错误。
 */
export function walkAgentNoteTree(): { notes: AgentNote[]; errors: string[] } {
  const notes: AgentNote[] = []
  const errors: string[] = []
  // 生命周期集合同样是封闭的：.agents/notes/ 下任何不是已知生命周期的目录，
  // 若放行会让其中的 Agent Note 对下面的遍历不可见。
  for (const entry of readdirSync(agentNoteRoot, { withFileTypes: true })) {
    if (entry.name === 'INDEX.md') {
      errors.push('structure: INDEX.md — centralized Agent Note indexes are forbidden; browse the lifecycle/class tree or search the repository')
      continue
    }
    if (entry.isDirectory()
      && entry.name !== AGENT_NOTE_ARCHIVE
      && !(AGENT_NOTE_LIFECYCLES as readonly string[]).includes(entry.name)) {
      errors.push(`structure: ${entry.name}/ — unknown lifecycle folder (allowed: ${AGENT_NOTE_LIFECYCLES.join(', ')}, plus ${AGENT_NOTE_ARCHIVE}/)`)
    }
  }
  for (const lifecycle of AGENT_NOTE_LIFECYCLES) {
    for (const match of globSync(`${lifecycle}/**/*.md`, { cwd: agentNoteRoot }).map(path => path.split(sep).join('/')).sort()) {
      const segs = match.split('/')
      // 直接位于生命周期根目录的白名单文件（例如 implemented/AGENTS.md）。
      if (segs.length === 2 && ROOT_ALLOWLIST.has(segs[1] ?? '')) continue
      if (match.endsWith('.zh.md')) {
        errors.push(`structure: ${match} — bilingual counterparts are not supported; keep one Chinese note`)
        continue
      }
      const cls = segs[1]
      const base = segs[2]
      if (segs.length !== 3 || cls === undefined || base === undefined) {
        errors.push(`structure: ${match} — expected {lifecycle}/{class}/file.md (got depth ${segs.length})`)
        continue
      }
      if (!(AGENT_NOTE_CLASSES as readonly string[]).includes(cls)) {
        errors.push(`structure: ${match} — unknown class folder "${cls}" (allowed: ${AGENT_NOTE_CLASSES.join(', ')})`)
        continue
      }
      if (!/^\d{4}-\d{2}-\d{2}-.+\.md$/.test(base)) {
        errors.push(`structure: ${match} — filename must be yyyy-mm-dd-topic.md`)
        continue
      }
      notes.push({ lifecycle, rel: match })
    }
  }
  return { notes, errors }
}
