/**
 * 校验研发任务的目录、状态、文件结构、终态记录和本地引用。
 * 任务文件按状态放在固定目录中；脚本只判断结构和引用是否一致，
 * 不判断任务是否真正完成，也不评价交付质量。
 */

import { existsSync, readdirSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import {
  documentHeadings,
  documentLinks,
  h2Section,
  parseDocumentFrontmatter,
  readRepositoryFile,
  REPO_ROOT,
} from './doc-tooling.ts'

const TASK_ROOT = '研发任务'
const ACTIVE = '进行中'
const ARCHIVE = '归档'
const TERMINAL = ['已交付', '已放弃', '已替代'] as const
const STATUS_BY_DIR = new Map<string, string>([
  [ACTIVE, '进行中'],
  [`${ARCHIVE}/已交付`, '已交付'],
  [`${ARCHIVE}/已放弃`, '已放弃'],
  [`${ARCHIVE}/已替代`, '已替代'],
])
const VALID_STATUSES = new Set(STATUS_BY_DIR.values())
const REQUIRED_SECTIONS = [
  '任务目标与背景',
  '关联输入',
  '工作范围与验收条件',
  '进展记录',
  '最终交付结果',
  '验证结果',
  '遗留问题',
] as const
const TASK_FILE = /^\d{4}-\d{2}-\d{2}-.+\.md$/u

const failures: string[] = []
const tasks = new Map<string, string>()

/** 记录一条可定位的结构错误。 */
function fail(message: string): void {
  failures.push(message)
}

/** 读取任务根目录下的一级条目。 */
function list(rel: string): Dirent[] {
  return readdirSync(resolve(REPO_ROOT, rel), { withFileTypes: true })
}

/** 校验一个任务目录，并把其中的 Markdown 任务加入检查集合。 */
function collectTasks(dirRel: string, status: string): void {
  for (const entry of list(dirRel)) {
    const path = `${dirRel}/${entry.name}`
    if (entry.name === '.gitkeep') continue
    if (entry.isDirectory()) {
      fail(`${path}: task directories must not contain nested directories`)
      continue
    }
    if (!entry.name.endsWith('.md')) {
      fail(`${path}: only Markdown task files and .gitkeep are allowed`)
      continue
    }
    if (!TASK_FILE.test(entry.name)) {
      fail(`${path}: filename must be yyyy-mm-dd-title.md`)
      continue
    }
    tasks.set(path, status)
  }
}

/** 解析任务中的本地链接，返回仓库相对目标；外部链接返回 undefined。 */
function localTarget(file: string, url: string, line: number): string | undefined {
  const raw = url.replace(/[#?].*$/u, '')
  if (raw === '' || raw.startsWith('#') || raw.startsWith('/')) return undefined
  if (/^[a-z][a-z0-9+.-]*:/iu.test(raw)) return undefined
  const absolute = resolve(REPO_ROOT, dirname(file), raw)
  if (!absolute.startsWith(REPO_ROOT + sep)) {
    fail(`${file}:${String(line)}: link escapes the repository: ${url}`)
    return undefined
  }
  const target = relative(REPO_ROOT, absolute).replaceAll('\\', '/')
  if (!existsSync(absolute)) {
    fail(`${file}:${String(line)}: linked path does not exist: ${target}`)
    return undefined
  }
  return target
}

/** 返回章节正文（不包含标题行）；章节不存在时返回 undefined。 */
function sectionBody(source: string, heading: string): string | undefined {
  const section = h2Section(source, heading)
  if (section === undefined) return undefined
  return section.split('\n').slice(1).join('\n').trim()
}

if (!existsSync(resolve(REPO_ROOT, TASK_ROOT))) {
  fail(`${TASK_ROOT}/: task root is missing`)
} else {
  if (!existsSync(resolve(REPO_ROOT, TASK_ROOT, 'README.md'))) {
    fail(`${TASK_ROOT}/README.md: task rules are required`)
  }
  for (const entry of list(TASK_ROOT)) {
    if (entry.isFile() && entry.name === 'README.md') continue
    if (entry.isDirectory() && (entry.name === ACTIVE || entry.name === ARCHIVE)) continue
    fail(`${TASK_ROOT}/${entry.name}: only README.md, ${ACTIVE}/ and ${ARCHIVE}/ are allowed at the task root`)
  }
  if (existsSync(resolve(REPO_ROOT, TASK_ROOT, ACTIVE))) {
    collectTasks(`${TASK_ROOT}/${ACTIVE}`, STATUS_BY_DIR.get(ACTIVE) ?? '')
  } else {
    fail(`${TASK_ROOT}/${ACTIVE}/: active task directory is missing`)
  }
  if (existsSync(resolve(REPO_ROOT, TASK_ROOT, ARCHIVE))) {
    for (const entry of list(`${TASK_ROOT}/${ARCHIVE}`)) {
      if (!entry.isDirectory() || !(TERMINAL as readonly string[]).includes(entry.name)) {
        fail(`${TASK_ROOT}/${ARCHIVE}/${entry.name}: only ${TERMINAL.join(', ')} directories are allowed`)
        continue
      }
      collectTasks(`${TASK_ROOT}/${ARCHIVE}/${entry.name}`, entry.name)
    }
    for (const status of TERMINAL) {
      if (!existsSync(resolve(REPO_ROOT, TASK_ROOT, ARCHIVE, status))) {
        fail(`${TASK_ROOT}/${ARCHIVE}/${status}/: terminal task directory is missing`)
      }
    }
  } else {
    fail(`${TASK_ROOT}/${ARCHIVE}/: archive directory is missing`)
  }
}

for (const [file, expectedStatus] of tasks) {
  const source = readRepositoryFile(file)
  const headings = documentHeadings(source)
  if (!headings.some(heading => heading.depth === 1)) fail(`${file}: missing H1 task title`)

  let frontmatter
  try {
    frontmatter = parseDocumentFrontmatter(source)
  } catch (error) {
    fail(`${file}: unreadable frontmatter: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  if (frontmatter === undefined) {
    fail(`${file}: missing YAML frontmatter with status`)
    continue
  }
  const fields = Object.keys(frontmatter.data)
  if (fields.length !== 1 || fields[0] !== 'status') {
    fail(`${file}: frontmatter must contain only the status field`)
  }
  const status = frontmatter.data.status
  if (typeof status !== 'string' || !VALID_STATUSES.has(status)) {
    fail(`${file}: status must be one of ${[...VALID_STATUSES].join(', ')}`)
  } else if (status !== expectedStatus) {
    fail(`${file}: status "${status}" does not match its directory (expected "${expectedStatus}")`)
  }

  const h2 = new Set(headings.filter(heading => heading.depth === 2).map(heading => heading.text))
  for (const section of REQUIRED_SECTIONS) {
    if (!h2.has(section)) fail(`${file}: missing ## ${section}`)
  }

  if (status === '已放弃' && (sectionBody(source, '放弃原因') ?? '').length === 0) {
    fail(`${file}: 已放弃 tasks need a non-empty ## 放弃原因`)
  }

  let replacementFound = false
  if (status === '已替代') {
    const section = h2Section(source, '替代关系')
    if (section === undefined) {
      fail(`${file}: 已替代 tasks need ## 替代关系`)
    } else {
      for (const link of documentLinks(section)) {
        const target = localTarget(file, link.url, link.line)
        if (target !== undefined && target !== file && tasks.has(target)) replacementFound = true
      }
      if (!replacementFound) fail(`${file}: 替代关系 must link an existing task file`)
    }
  }

  for (const link of documentLinks(source)) {
    localTarget(file, link.url, link.line)
  }
}

if (failures.length > 0) {
  console.error('verify-tasks: task structure violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

const activeCount = [...tasks.values()].filter(status => status === '进行中').length
const archivedCount = tasks.size - activeCount
console.log(
  `verify-tasks: ${String(tasks.size)} task(s) checked`
  + ` (${String(activeCount)} active, ${String(archivedCount)} archived), all conform.`,
)
