/**
 * List the documentation owners touched by the current change set. Rules come
 * from `scripts/change-doc-rules.json`; each maps changed paths to the
 * documents that own their facts.
 *
 * Rules are advisory by default. `remind` rules always print, and `require`
 * rules fail only under `--strict`, which runs the established mandatory
 * checks. `--strict` never promotes `remind` rules, so it cannot force
 * meaningless document edits. Missing Git or an unreadable baseline is
 * reported as a short message instead of a Node stack trace.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const RULES_PATH = 'scripts/change-doc-rules.json'

/** One configured ownership rule after validation. */
interface ChangeDocRule {
  /** Glob patterns matched against repository-relative changed paths. */
  when: string[]
  /** Repository-relative documents that own the affected facts. */
  owners: string[]
  /** Why these documents own the changed paths. */
  reason: string
  /** Whether a missing owner fails under `--strict`. */
  level: 'remind' | 'require'
  /** Compiled path patterns. */
  patterns: RegExp[]
}

/** A Git invocation that failed, with the parts needed for a clean message. */
class GitFailure extends Error {
  /** Captured stderr, empty when Git wrote nothing. */
  readonly stderr: string
  /** Exit status or `ENOENT` when the executable is absent. */
  readonly exitCode: number | string | undefined

  constructor(cause: unknown) {
    const error = cause as { stderr?: string | Buffer; message?: string; code?: number | string } | null
    super(error?.message ?? 'git command failed')
    this.stderr = typeof error?.stderr === 'string' ? error.stderr : error?.stderr?.toString('utf8') ?? ''
    this.exitCode = error?.code
  }
}

/** A plain JSON object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Reject unsupported command-line arguments instead of silently ignoring them. */
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
 * Convert a repository-relative glob into a path regex. `**` spans zero or more
 * directories, `*` stays within one segment, and `?` matches one non-slash
 * character; every other character is literal. Unsupported brace, class, and
 * extglob syntax is rejected loudly instead of matching nothing.
 * @param glob - pattern using `/` separators.
 * @returns an anchored expression over forward-slash paths.
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

/** Read and validate the ownership manifest. */
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

/** Run one Git command and return its newline-separated output. */
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
 * Collect changed paths relative to the baseline, including untracked files.
 * @returns changed paths, or undefined when Git itself is unavailable.
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

/** Run the ownership check and return the process exit code. */
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
