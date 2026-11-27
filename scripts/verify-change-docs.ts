/**
 * 列出当前变更集触及的文档所有者。规则来自
 * `scripts/change-doc-rules.json`，每条规则把变更路径映射到
 * 拥有这些事实的文档。
 *
 * 规则默认是提示性的。`remind` 规则始终输出，`require` 规则
 * 仅在 `--strict` 下失败，该模式运行已建立的强制检查。
 * `--strict` 从不把 `remind` 规则升级为强制，因此无法强制
 * 做出无意义的文档修改。缺少 Git 或基线不可读时，以简短
 * 消息报告，而不是 Node 堆栈跟踪。
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const RULES_PATH = 'scripts/change-doc-rules.json'

/** 校验后的一条已配置所有权规则。 */
interface ChangeDocRule {
  /** 与仓库相对变更路径匹配的 glob 模式。 */
  when: string[]
  /** 拥有受影响事实的仓库相对文档。 */
  owners: string[]
  /** 这些文档为何拥有变更路径。 */
  reason: string
  /** 缺少所有者时是否在 `--strict` 下失败。 */
  level: 'remind' | 'require'
  /** 编译后的路径模式。 */
  patterns: RegExp[]
}

/** 一次失败的 Git 调用，带有生成简洁消息所需的部分。 */
class GitFailure extends Error {
  /** 捕获的 stderr，Git 无输出时为空。 */
  readonly stderr: string
  /** 退出状态；可执行文件缺失时为 `ENOENT`。 */
  readonly exitCode: number | string | undefined

  constructor(cause: unknown) {
    const error = cause as { stderr?: string | Buffer; message?: string; code?: number | string } | null
    super(error?.message ?? 'git command failed')
    this.stderr = typeof error?.stderr === 'string' ? error.stderr : error?.stderr?.toString('utf8') ?? ''
    this.exitCode = error?.code
  }
}

/** 一个普通 JSON 对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 拒绝不支持的命令行参数，而不是静默忽略。 */
function parseArguments(argv: readonly string[]): { base: string; strict: boolean } {
  let base = 'HEAD'
  let strict = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? ''
    if (argument === '--strict') {
      strict = true
      continue
    }
    if (argument === '--base') {
      const value = argv[index + 1]
      if (value === undefined || value.startsWith('--')) throw new Error('--base requires a Git reference')
      base = value
      index += 1
      continue
    }
    if (argument.startsWith('--base=')) {
      const value = argument.slice('--base='.length)
      if (value === '') throw new Error('--base requires a Git reference')
      base = value
      continue
    }
    throw new Error(`unknown argument: ${argument}`)
  }
  return { base, strict }
}

/**
 * 把仓库相对 glob 转换为路径正则。`**` 跨越零个或多个
 * 目录，`*` 限定在一个路径段内，`?` 匹配一个非斜杠字符；
 * 其他每个字符都按字面处理。不支持的括号、字符类和
 * extglob 语法会被显式拒绝，而不是静默匹配不到内容。
 * @param glob - 使用 `/` 分隔符的模式。
 * @returns 作用于正斜杠路径的锚定表达式。
 */
function globToRegExp(glob: string): RegExp {
  if (/[[\]{}()!+@\\]/u.test(glob)) throw new Error(`unsupported glob syntax: ${glob}`)
  let expression = ''
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index]
    if (character === '*') {
      if (glob[index + 1] === '*') {
        index += 1
        if (glob[index + 1] === '/') {
          index += 1
          expression += '(?:.*/)?'
        } else {
          expression += '.*'
        }
      } else {
        expression += '[^/]*'
      }
      continue
    }
    if (character === '?') {
      expression += '[^/]'
      continue
    }
    expression += (character ?? '').replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  }
  return new RegExp(`^${expression}$`, 'u')
}

/** 读取并校验所有权清单。 */
function readRules(): ChangeDocRule[] {
  const absolute = resolve(REPO_ROOT, RULES_PATH)
  if (!existsSync(absolute)) throw new Error(`${RULES_PATH} does not exist`)
  const parsed: unknown = JSON.parse(readFileSync(absolute, 'utf8'))
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.rules)) {
    throw new Error(`${RULES_PATH} must declare version 1 and a rules array`)
  }
  return parsed.rules.map((entry: unknown, index: number) => {
    const at = `rules[${String(index)}]`
    if (!isRecord(entry)) throw new Error(`${RULES_PATH}: ${at} must be an object`)
    const when = entry.when
    const owners = entry.owners
    if (!Array.isArray(when) || when.length === 0 || when.some(value => typeof value !== 'string' || value === '')) {
      throw new Error(`${RULES_PATH}: ${at}.when must be a non-empty string array`)
    }
    if (!Array.isArray(owners) || owners.length === 0 || owners.some(value => typeof value !== 'string' || value === '')) {
      throw new Error(`${RULES_PATH}: ${at}.owners must be a non-empty string array`)
    }
    const level = entry.level ?? 'remind'
    if (level !== 'remind' && level !== 'require') throw new Error(`${RULES_PATH}: ${at}.level must be remind or require`)
    const reason = entry.reason ?? ''
    if (typeof reason !== 'string') throw new Error(`${RULES_PATH}: ${at}.reason must be a string`)
    for (const owner of owners) {
      if (!existsSync(resolve(REPO_ROOT, owner))) throw new Error(`${RULES_PATH}: ${at}.owners names a missing document: ${owner}`)
    }
    return {
      when: when as string[],
      owners: owners as string[],
      reason,
      level,
      patterns: (when as string[]).map(globToRegExp),
    }
  })
}

/** 运行一条 Git 命令，返回按换行分隔的输出。 */
function gitLines(args: readonly string[]): string[] {
  try {
    const output = execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd()
    return output === '' ? [] : output.split('\n')
  } catch (error) {
    throw new GitFailure(error)
  }
}

/**
 * 收集相对于基线的变更路径，包括未跟踪文件。
 * @returns 变更路径；Git 本身不可用时为 undefined。
 */
function changedFiles(base: string): string[] | undefined {
  try {
    const tracked = gitLines(['diff', '--name-only', '--relative', base, '--'])
    const untracked = gitLines(['ls-files', '--others', '--exclude-standard'])
    return [...new Set([...tracked, ...untracked])].map(path => path.replaceAll('\\', '/')).sort()
  } catch (error) {
    if (!(error instanceof GitFailure)) throw error
    if (error.exitCode === 'ENOENT' || /not a git repository/iu.test(error.stderr)) {
      console.log('verify-change-docs: skipped (git unavailable); review affected documents manually.')
      return undefined
    }
    const detail = error.stderr.trim() || error.message
    throw new Error(`cannot read git baseline ${JSON.stringify(base)}: ${detail}`)
  }
}

/** 运行所有权检查并返回进程退出码。 */
function main(): number {
  const { base, strict } = parseArguments(process.argv.slice(2))
  const rules = readRules()
  const changed = changedFiles(base)
  if (changed === undefined) return 0

  if (changed.length === 0) {
    console.log(`verify-change-docs: no changed files against ${base}.`)
    return 0
  }

  const hasRequireRules = rules.some(rule => rule.level === 'require')
  if (strict && !hasRequireRules) {
    console.log('verify-change-docs: --strict has no effect: no rule declares level "require".')
  }

  const changedSet = new Set(changed)
  const failures: string[] = []
  let matched = 0

  for (const rule of rules) {
    const affected = changed.filter(path => rule.patterns.some(pattern => pattern.test(path)))
    if (affected.length === 0) continue
    matched += 1
    const enforced = strict && rule.level === 'require'
    for (const owner of rule.owners) {
      const updated = changedSet.has(owner)
      if (updated) {
        console.log(`  updated  ${owner}`)
        continue
      }
      if (enforced) {
        failures.push(`${owner} owns ${affected.slice(0, 3).join(', ')}${affected.length > 3 ? ` and ${String(affected.length - 3)} more` : ''}`)
        console.log(`  MISSING  ${owner}`)
      } else {
        const label = rule.level === 'require' ? 'required' : 'check'
        console.log(`  ${label.padEnd(8)} ${owner}`)
      }
    }
    if (rule.reason !== '') console.log(`           ${rule.reason}`)
  }

  if (failures.length > 0) {
    console.error('verify-change-docs: changed paths need their owning documents in the same change (--strict):')
    for (const failure of failures) console.error(`  ${failure}`)
    return 1
  }

  if (matched === 0) {
    console.log(`verify-change-docs: ${String(changed.length)} changed file(s) against ${base}; no ownership rule matched. Add a rule to ${RULES_PATH} when a document owns this fact.`)
    return 0
  }

  console.log(`verify-change-docs: ${String(changed.length)} changed file(s) against ${base}; ${String(matched)} rule(s) matched.`)
  return 0
}

try {
  process.exitCode = main()
} catch (error) {
  console.error(`verify-change-docs: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
