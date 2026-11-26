/**
 * Report the explicit committed and worktree scope of a repository change.
 * The report is the common input for review and pre-push check selection; it
 * names paths only and does not decide which checks or documents are required.
 */

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

const FORMAT_VERSION = 1
const MAX_GIT_OUTPUT = 64 * 1024 * 1024
const REPO_ROOT = resolve(import.meta.dirname, '..')

interface ChangeScopeReport {
  formatVersion: typeof FORMAT_VERSION
  repositoryRoot: string
  input: { base: string; head: string }
  resolved: {
    baseSha: string
    headSha: string
    mergeBaseSha: string
    worktree: boolean
  }
  paths: {
    committed: string[]
    staged: string[]
    unstaged: string[]
    untracked: string[]
  }
}

/** Run Git and return UTF-8 stdout, or throw a short diagnostic. */
function git(args: readonly string[]): string {
  const result = spawnSync('git', ['-C', REPO_ROOT, ...args], {
    encoding: 'utf8',
    maxBuffer: MAX_GIT_OUTPUT,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', LANG: 'C', LC_ALL: 'C' },
  })
  if (result.error !== undefined) throw new Error(`cannot run git: ${result.error.message}`)
  if (result.status !== 0) {
    const detail = result.stderr.trim()
    throw new Error(detail === '' ? `git exited with status ${String(result.status)}` : detail)
  }
  return result.stdout
}

/** Resolve a ref to a full commit id. */
function resolveCommit(ref: string, label: string): string {
  const result = spawnSync('git', ['-C', REPO_ROOT, 'rev-parse', '--verify', `${ref}^{commit}`], {
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  })
  if (result.error !== undefined) throw new Error(`cannot run git: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`cannot resolve ${label} ref ${JSON.stringify(ref)}`)
  return result.stdout.trim()
}

/** Split NUL-separated Git path output, preserving only non-empty paths. */
function splitPaths(output: string): string[] {
  return output.split('\0').filter(path => path !== '')
}

/** Sort and deduplicate path lists. */
function normalize(paths: readonly string[]): string[] {
  return [...new Set(paths)].sort()
}

/** Build the change-scope report for the requested base and head. */
function report(base: string, head: string): ChangeScopeReport {
  const baseSha = resolveCommit(base, 'base')
  const headSha = resolveCommit(head, 'head')
  const mergeBaseSha = git(['merge-base', baseSha, headSha]).trim()
  const headIsCurrent = resolveCommit('HEAD', 'HEAD') === headSha
  const committed = splitPaths(git(['diff', '--name-only', '-z', mergeBaseSha, headSha]))
  const staged = headIsCurrent ? splitPaths(git(['diff', '--cached', '--name-only', '-z'])) : []
  const unstaged = headIsCurrent ? splitPaths(git(['diff', '--name-only', '-z'])) : []
  const untracked = headIsCurrent ? splitPaths(git(['ls-files', '--others', '--exclude-standard', '-z'])) : []
  return {
    formatVersion: FORMAT_VERSION,
    repositoryRoot: REPO_ROOT,
    input: { base, head },
    resolved: { baseSha, headSha, mergeBaseSha, worktree: headIsCurrent },
    paths: {
      committed: normalize(committed),
      staged: normalize(staged),
      unstaged: normalize(unstaged),
      untracked: normalize(untracked),
    },
  }
}

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    base: { type: 'string' },
    head: { type: 'string', default: 'HEAD' },
  },
  strict: true,
})

if (values.base === undefined) {
  console.error('change-scope: missing required --base <ref>')
  process.exitCode = 1
} else {
  try {
    console.log(JSON.stringify(report(values.base, values.head), null, 2))
  } catch (error) {
    console.error(`change-scope: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
