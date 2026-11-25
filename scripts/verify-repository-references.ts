/**
 * Reject maintained references to real repository commits. History should be
 * cited by release tag or PR number instead of a commit identifier, because
 * tags and PR numbers stay meaningful after history rewrites. A hexadecimal
 * token only counts as a commit reference when the local Git object database
 * resolves it to exactly one object of type `commit`, so digests, sizes, and
 * decimal-only tokens never trigger the gate. Frozen history under
 * `.agents/notes/archived/` and third-party sources under `vendor/` are
 * excluded.
 */

import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, readlinkSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

// A hexadecimal run with at least one hex letter; decimal-only tokens collide
// with sizes, counts, and version components.
const commitCandidate = /(?<![a-z0-9])(?=[\da-f]{0,39}[a-f])[\da-f]{7,40}(?![a-z0-9])/gi
const excludedPrefixes = ['vendor/', '.agents/notes/archived/']
const gitOutputLimit = 64 * 1024 * 1024
// One 41-byte line per object; 1.2 million objects produce about 49 MiB.
const objectListingLimit = 1024 * 1024 * 1024

/** One prohibited commit reference in a maintained source file. */
export interface RepositoryReference {
  /** Repository-relative path, with forward slashes. */
  file: string
  /** One-based source line containing the reference. */
  line: number
  /** The matched hexadecimal identifier, lowercased. */
  ref: string
}

/** Whether a path is maintained prose rather than vendored or frozen history. */
function isMaintained(file: string): boolean {
  const path = file.replaceAll('\\', '/')
  return !excludedPrefixes.some(prefix => path.startsWith(prefix))
}

/**
 * Inspect a maintained source file against known commit identifiers.
 * @param file - Repository-relative path used in diagnostics and exclusions.
 * @param source - File text or a symlink's stored target.
 * @param commits - Lowercase, unambiguous identifiers that name commit objects.
 * @returns One finding per offending identifier and line, in source order.
 */
export function findRepositoryReferences(
  file: string,
  source: string,
  commits: ReadonlySet<string>,
): RepositoryReference[] {
  if (!isMaintained(file)) return []
  const references: RepositoryReference[] = []
  for (const [index, line] of source.split('\n').entries()) {
    const seen = new Set<string>()
    for (const match of line.matchAll(commitCandidate)) {
      const ref = match[0].toLowerCase()
      if (!commits.has(ref) || seen.has(ref)) continue
      seen.add(ref)
      references.push({ file, line: index + 1, ref })
    }
  }
  return references
}

/** Read tracked and nonignored new maintained files, following symlinks to their stored target. */
function readMaintainedFiles(repoRoot: string): Map<string, string> {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: gitOutputLimit,
  }).split('\0').filter(file => file !== '' && isMaintained(file))
  const sources = new Map<string, string>()
  for (const file of files) {
    const path = resolve(repoRoot, file)
    const stat = lstatSync(path, { throwIfNoEntry: false })
    if (stat?.isSymbolicLink() === true) sources.set(file, readlinkSync(path))
    else if (stat?.isFile() === true) sources.set(file, readFileSync(path, 'utf8'))
  }
  return sources
}

/** Run one Git command that reports newline-separated names. */
function gitLines(repoRoot: string, args: readonly string[], maxBuffer: number, input?: string): string[] {
  const output = execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1' },
    encoding: 'utf8',
    input,
    maxBuffer,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trimEnd()
  return output === '' ? [] : output.split('\n')
}

/**
 * Find the one object whose name starts with a prefix.
 * @param objects - Every object name in the local object database, sorted.
 * @param prefix - Lowercase hexadecimal prefix.
 * @returns The matching object name, or `undefined` when none or several match.
 */
export function uniquePrefixMatch(objects: readonly string[], prefix: string): string | undefined {
  let low = 0
  let high = objects.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if ((objects[middle] ?? prefix) < prefix) low = middle + 1
    else high = middle
  }
  const match = objects[low]
  if (match?.startsWith(prefix) !== true || objects[low + 1]?.startsWith(prefix) === true) return undefined
  return match
}

/**
 * Resolve commit-identifier candidates in maintained sources against the local object database.
 * @param repoRoot - Working tree whose Git objects are inspected.
 * @param sources - File texts or symlink targets to extract candidates from.
 * @returns Lowercase candidates that name exactly one available object of type commit.
 */
export function repositoryCommits(repoRoot: string, sources: Iterable<string>): Set<string> {
  const candidates = [...new Set([...sources].flatMap(source =>
    [...source.matchAll(commitCandidate)].map(match => match[0].toLowerCase())))]
  if (candidates.length === 0) return new Set()
  // Git resolves prefixes across all available objects, including unreachable and alternate ones;
  // one listing of those objects replaces one Git prefix lookup per candidate.
  // Ambiguous prefixes do not identify one object and cannot establish a commit reference.
  const objects = gitLines(repoRoot, ['cat-file', '--batch-all-objects', '--batch-check=%(objectname)'], objectListingLimit).sort()
  const matches = new Map<string, string>()
  for (const candidate of candidates) {
    const object = uniquePrefixMatch(objects, candidate)
    if (object !== undefined) matches.set(candidate, object)
  }
  if (matches.size === 0) return new Set()
  const matched = [...new Set(matches.values())]
  const commits = new Set(gitLines(repoRoot, ['cat-file', '--batch-check=%(objectname) %(objecttype)'], gitOutputLimit, `${matched.join('\n')}\n`)
    .map(line => line.split(' '))
    .filter(([, type]) => type === 'commit')
    .map(([object]) => object))
  return new Set([...matches].filter(([, object]) => commits.has(object)).map(([candidate]) => candidate))
}

/**
 * Scan tracked and nonignored new files using only the local Git object database.
 * @param repoRoot - Working tree whose files and Git objects are inspected.
 * @returns Prohibited references outside vendor and frozen Agent Notes; absent shallow-history objects cannot match.
 */
export function scanRepositoryReferences(repoRoot: string): RepositoryReference[] {
  const sources = readMaintainedFiles(repoRoot)
  const commits = repositoryCommits(repoRoot, sources.values())
  return [...sources].flatMap(([file, source]) => findRepositoryReferences(file, source, commits))
}

const invokedPath = process.argv[1]
if (invokedPath !== undefined && import.meta.filename === resolve(invokedPath)) {
  const references = scanRepositoryReferences(root)
  if (references.length === 0) {
    console.log('verify-repository-references: maintained files cite no commit identifiers; history references use tags or PR numbers.')
  } else {
    console.error('verify-repository-references: history references must use a release tag or PR number, not a commit identifier:')
    for (const { file, line, ref } of references) console.error(`  ${file}:${String(line)}  ${ref}`)
    process.exitCode = 1
  }
}
