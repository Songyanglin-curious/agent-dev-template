/**
 * Failure-path tests for the documentation gates. A passing gate on healthy
 * input does not prove that it can detect violations, so each case builds a
 * small temporary workspace, copies the gate scripts, links the repository's
 * installed dependencies, and asserts that invalid input is rejected with a
 * locatable diagnostic.
 */

import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const REPO_ROOT = resolve(import.meta.dirname, '../..')

/** One isolated repository snapshot with a runner for a gate script. */
interface Workspace {
  /** Absolute temporary workspace root. */
  dir: string
  /** Run one gate script from the workspace and capture its output. */
  run: (script: string, args?: readonly string[]) => { status: number | null; stdout: string; stderr: string }
}

/**
 * Create a temporary workspace containing every top-level gate script, a
 * minimal module package.json, the given fixture files, and a link to the
 * repository's installed dependencies.
 * @param files - repository-relative fixture paths and their contents.
 * @returns the workspace handle.
 */
function workspace(files: Readonly<Record<string, string>>): Workspace {
  const dir = mkdtempSync(join(tmpdir(), 'adt-gate-'))
  const scripts = join(dir, 'scripts')
  mkdirSync(scripts, { recursive: true })
  for (const name of readdirSync(join(REPO_ROOT, 'scripts'))) {
    const source = join(REPO_ROOT, 'scripts', name)
    if (!name.endsWith('.ts') || !statSync(source).isFile()) continue
    copyFileSync(source, join(scripts, name))
  }
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n')
  symlinkSync(
    join(REPO_ROOT, 'node_modules'),
    join(dir, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  for (const [path, content] of Object.entries(files)) {
    const absolute = join(dir, path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, content)
  }
  return {
    dir,
    run(script, args = []) {
      const result = spawnSync(process.execPath, [join('scripts', script), ...args], {
        cwd: dir,
        encoding: 'utf8',
      })
      return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
    },
  }
}

/** Initialize Git in a workspace so change-scoped gates have a baseline. */
function initGit(current: Workspace, commit = false): void {
  const run = (args: readonly string[]): void => {
    const result = spawnSync('git', args, { cwd: current.dir, encoding: 'utf8' })
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr ?? ''}`)
  }
  run(['init'])
  run(['config', 'user.email', 'gate-test@example.com'])
  run(['config', 'user.name', 'Gate Test'])
  if (commit) {
    run(['add', '-A'])
    run(['commit', '-m', 'fixture baseline'])
  }
}

/** Return the current commit hash of a test workspace. */
function headCommit(current: Workspace): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: current.dir, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git rev-parse HEAD failed: ${result.stderr ?? ''}`)
  return (result.stdout ?? '').trim()
}

/** Remove a workspace, including its dependency junction, without following it. */
function cleanup(current: Workspace): void {
  rmSync(current.dir, { recursive: true, force: true })
}

test('verify-md-links rejects a missing relative target', () => {
  const current = workspace({ 'docs/bad.md': '# Bad\n\n[missing](missing.md)\n' })
  try {
    const result = current.run('verify-md-links.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /bad\.md:\d+/u)
    assert.match(result.stderr, /missing\.md/u)
  } finally {
    cleanup(current)
  }
})

test('verify-md-links checks module READMEs outside docs/', () => {
  const current = workspace({ 'mods/widget/README.md': '# Widget\n\n[missing](missing.md)\n' })
  try {
    const result = current.run('verify-md-links.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /widget\/README\.md:\d+/u)
    assert.match(result.stderr, /missing\.md/u)
  } finally {
    cleanup(current)
  }
})

test('verify-doc-budgets rejects a missing budgeted document', () => {
  const current = workspace({
    'scripts/doc-budgets.manifest.json': `${JSON.stringify({ 'docs/required.md': 10 }, null, 4)}\n`,
  })
  try {
    const result = current.run('verify-doc-budgets.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /docs\/required\.md/u)
    assert.match(result.stderr, /does not exist/u)
  } finally {
    cleanup(current)
  }
})

test('verify-change-docs reports an unreadable baseline without a stack trace', () => {
  const current = workspace({
    'scripts/change-doc-rules.json': '{"version":1,"rules":[]}\n',
    'docs/owner.md': '# Owner\n',
  })
  try {
    initGit(current)
    const result = current.run('verify-change-docs.ts', ['--base', 'does-not-exist'])
    assert.equal(result.status, 1)
    assert.match(result.stderr, /cannot read git baseline/u)
    assert.doesNotMatch(result.stderr, /^\s+at /mu)
  } finally {
    cleanup(current)
  }
})

test('verify-change-docs skips when Git is unavailable', () => {
  const current = workspace({
    'scripts/change-doc-rules.json': '{"version":1,"rules":[]}\n',
  })
  try {
    const result = current.run('verify-change-docs.ts')
    assert.equal(result.status, 0)
    assert.match(result.stdout, /skipped \(git unavailable\)/u)
  } finally {
    cleanup(current)
  }
})

test('verify-change-docs enforces require rules only under --strict', () => {
  const rules = JSON.stringify({
    version: 1,
    rules: [{
      when: ['scripts/**/*.ts'],
      owners: ['docs/owner.md'],
      reason: 'fixture ownership',
      level: 'require',
    }],
  })
  const current = workspace({
    '.gitignore': 'node_modules/\n',
    'scripts/change-doc-rules.json': `${rules}\n`,
    'scripts/foo.ts': 'export const value = 1\n',
    'docs/owner.md': '# Owner\n',
  })
  try {
    initGit(current, true)
    writeFileSync(join(current.dir, 'scripts/foo.ts'), 'export const value = 2\n')
    const advisory = current.run('verify-change-docs.ts')
    assert.equal(advisory.status, 0)
    assert.match(advisory.stdout, /required\s+docs\/owner\.md/u)
    const strict = current.run('verify-change-docs.ts', ['--strict'])
    assert.equal(strict.status, 1)
    assert.match(strict.stderr, /docs\/owner\.md/u)
  } finally {
    cleanup(current)
  }
})

test('verify-agent-note-format rejects a malformed note', () => {
  const current = workspace({
    '.agents/notes/proposed/feature/2026-01-01-bad.md': '# Wrong\n\nStatus: proposed\n',
  })
  try {
    const result = current.run('verify-agent-note-format.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /line 1 must be/u)
    assert.match(result.stderr, /2026-01-01-bad\.md/u)
  } finally {
    cleanup(current)
  }
})

test('verify-subsystem-pages checks ungrouped modules alongside module groups', () => {
  const moduleDoc = (name: string): string => `---\ndescription: "${name} module."\nkind: "module"\n---\n# ${name}\n`
  const current = workspace({
    'docs/subsystems/group.md': '# Group\n',
    'mods/a/README.md': moduleDoc('A'),
    'mods/b/README.md': moduleDoc('B'),
    'mods/c/README.md': moduleDoc('C'),
    'mods/g/README.md': [
      '---',
      'description: "Group module."',
      'kind: "module-group"',
      '---',
      '# Group',
      '',
      '## 模块与职责',
      '',
      '| 模块 | 职责 |',
      '|---|---|',
      '| [A](../a/README.md) | A |',
      '| [B](../b/README.md) | B |',
      '',
      '[Group subsystem](../../docs/subsystems/group.md)',
      '',
    ].join('\n'),
  })
  try {
    const failure = current.run('verify-subsystem-pages.ts')
    assert.equal(failure.status, 1)
    assert.match(failure.stderr, /mods\/c\/README\.md/u)
    assert.doesNotMatch(failure.stderr, /mods\/a\/README\.md/u)
    assert.doesNotMatch(failure.stderr, /mods\/b\/README\.md/u)

    writeFileSync(
      join(current.dir, 'mods/c/README.md'),
      `${moduleDoc('C')}\n[Group subsystem](../../docs/subsystems/group.md)\n`,
    )
    const success = current.run('verify-subsystem-pages.ts')
    assert.equal(success.status, 0)
    assert.match(success.stdout, /2 unit\(s\) checked \(1 module group\(s\), 1 independent module\(s\)\)/u)
  } finally {
    cleanup(current)
  }
})

test('verify-repository-references rejects a maintained commit reference', () => {
  const current = workspace({
    '.gitignore': 'node_modules/\n',
    'docs/bad.md': '# Bad\n',
  })
  try {
    initGit(current, true)
    const commit = headCommit(current)
    writeFileSync(join(current.dir, 'docs/bad.md'), `# Bad\n\n${commit}\n`)
    const result = current.run('verify-repository-references.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /docs\/bad\.md/u)
    assert.match(result.stderr, new RegExp(commit, 'u'))
  } finally {
    cleanup(current)
  }
})

test('verify-repository-references ignores raw research inputs', () => {
  const current = workspace({
    '.gitignore': 'node_modules/\n',
    '研发输入/raw.md': '# Raw\n',
  })
  try {
    initGit(current, true)
    const commit = headCommit(current)
    writeFileSync(join(current.dir, '研发输入/raw.md'), `# Raw\n\n${commit}\n`)
    const result = current.run('verify-repository-references.ts')
    assert.equal(result.status, 0)
    assert.doesNotMatch(result.stderr, /研发输入\/raw\.md/u)
  } finally {
    cleanup(current)
  }
})
