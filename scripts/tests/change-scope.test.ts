import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const REPO_ROOT = resolve(import.meta.dirname, '../..')

interface Workspace {
  dir: string
  run: (args?: readonly string[]) => { status: number | null; stdout: string; stderr: string }
}

/** Run Git in a test workspace and fail the test if the command fails. */
function git(dir: string, args: readonly string[]): string {
  const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr ?? ''}`)
  return result.stdout
}

/** Create a temporary checkout containing the change-scope script. */
function workspace(): Workspace {
  const dir = mkdtempSync(join(tmpdir(), 'adt-change-scope-'))
  const scripts = join(dir, 'scripts')
  mkdirSync(scripts, { recursive: true })
  copyFileSync(join(REPO_ROOT, 'scripts', 'change-scope.ts'), join(scripts, 'change-scope.ts'))
  return {
    dir,
    run(args = []) {
      const result = spawnSync(process.execPath, [join('scripts', 'change-scope.ts'), ...args], {
        cwd: dir,
        encoding: 'utf8',
      })
      return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
    },
  }
}

/** Initialize Git with the minimum identity needed for fixture commits. */
function initGit(dir: string): void {
  git(dir, ['init'])
  git(dir, ['config', 'user.email', 'change-scope-test@example.com'])
  git(dir, ['config', 'user.name', 'Change Scope Test'])
}

/** Remove a workspace recursively. */
function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}

test('change-scope reports committed, staged, unstaged, and untracked paths', () => {
  const current = workspace()
  try {
    initGit(current.dir)
    writeFileSync(join(current.dir, 'tracked.txt'), 'base\n')
    git(current.dir, ['add', '-A'])
    git(current.dir, ['commit', '-m', 'base'])
    const base = git(current.dir, ['rev-parse', 'HEAD']).trim()

    writeFileSync(join(current.dir, 'committed.txt'), 'committed\n')
    git(current.dir, ['add', 'committed.txt'])
    git(current.dir, ['commit', '-m', 'committed change'])

    writeFileSync(join(current.dir, 'tracked.txt'), 'changed\n')
    writeFileSync(join(current.dir, 'staged.txt'), 'staged\n')
    git(current.dir, ['add', 'staged.txt'])
    writeFileSync(join(current.dir, 'untracked.txt'), 'untracked\n')

    const result = current.run(['--base', base])
    assert.equal(result.status, 0)
    const report = JSON.parse(result.stdout) as {
      paths: { committed: string[]; staged: string[]; unstaged: string[]; untracked: string[] }
    }
    assert.deepEqual(report.paths.committed, ['committed.txt'])
    assert.deepEqual(report.paths.staged, ['staged.txt'])
    assert.deepEqual(report.paths.unstaged, ['tracked.txt'])
    assert.deepEqual(report.paths.untracked, ['untracked.txt'])
  } finally {
    cleanup(current.dir)
  }
})

test('change-scope rejects an unresolved base', () => {
  const current = workspace()
  try {
    initGit(current.dir)
    const result = current.run(['--base', 'does-not-exist'])
    assert.equal(result.status, 1)
    assert.match(result.stderr, /cannot resolve base ref/u)
    assert.doesNotMatch(result.stderr, /^\s+at /mu)
  } finally {
    cleanup(current.dir)
  }
})

test('change-scope requires a base argument', () => {
  const current = workspace()
  try {
    const result = current.run()
    assert.equal(result.status, 1)
    assert.match(result.stderr, /missing required --base/u)
  } finally {
    cleanup(current.dir)
  }
})
