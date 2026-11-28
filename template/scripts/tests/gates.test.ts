/**
 * 文档与任务门禁的失败路径测试。门禁在健康输入上通过并不能
 * 证明它能发现违规，因此每个用例都构建一个临时工作区，复制
 * 门禁脚本、链接当前安装的依赖，断言无效输入被拒绝且诊断可定位。
 */

import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const REPO_ROOT = resolve(import.meta.dirname, '../..')

/** 一个隔离的仓库快照，附带运行门禁脚本的入口。 */
interface Workspace {
  /** 临时工作区的绝对根路径。 */
  dir: string
  /** 从工作区运行一个门禁脚本并捕获其输出。 */
  run: (script: string, args?: readonly string[]) => { status: number | null; stdout: string; stderr: string }
}

/**
 * 创建临时工作区，包含顶层门禁脚本、最小模块 package.json、给定夹具，
 * 以及指向当前安装依赖的链接。
 * @param files - 仓库相对的夹具路径及其内容。
 * @returns 工作区句柄。
 */
function workspace(files: Readonly<Record<string, string>>): Workspace {
  const dir = mkdtempSync(join(tmpdir(), 'doc-gate-'))
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

/** 在工作区初始化 Git，可选地把当前内容提交为基线。 */
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

/** 删除工作区，不跟随其中的依赖链接。 */
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

test('verify-md-links checks READMEs outside docs/', () => {
  const current = workspace({ 'mods/widget/README.md': '# Widget\n\n[missing](missing.md)\n' })
  try {
    const result = current.run('verify-md-links.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /widget\/README\.md:\d+/u)
  } finally {
    cleanup(current)
  }
})

test('verify-doc-budgets rejects a missing budgeted document', () => {
  const current = workspace({
    'scripts/doc-budgets.manifest.json': `${JSON.stringify({ 'docs/required.md': 10 }, null, 2)}\n`,
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

test('verify-change-docs skips when the project is not a Git worktree', () => {
  const current = workspace({ 'scripts/change-doc-rules.json': '{"version":1,"rules":[]}\n' })
  try {
    const result = current.run('verify-change-docs.ts')
    assert.equal(result.status, 0)
    assert.match(result.stdout, /skipped \(no Git worktree at the project root\)/u)
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

test('verify-change-docs matches Chinese and spaced paths in owners', () => {
  const rules = JSON.stringify({
    version: 1,
    rules: [{
      when: ['研发任务/**/*.md'],
      owners: ['docs/文档规则.md'],
      reason: 'fixture ownership with non-ASCII paths',
      level: 'require',
    }],
  })
  const current = workspace({
    '.gitignore': 'node_modules/\n',
    'scripts/change-doc-rules.json': `${rules}\n`,
    '研发任务/进行中/2026-01-01-示例任务.md': '# 任务\n',
    'docs/文档规则.md': '# 文档规则\n',
  })
  try {
    initGit(current, true)
    writeFileSync(join(current.dir, '研发任务/进行中/2026-01-01-示例任务.md'), '# 任务\n\n更新。\n')
    writeFileSync(join(current.dir, 'docs/文档规则.md'), '# 文档规则\n\n规则正文。\n')
    const result = current.run('verify-change-docs.ts', ['--base', 'HEAD', '--strict'])
    assert.equal(result.status, 0)
    assert.match(result.stdout, /updated\s+docs\/文档规则\.md/u)
  } finally {
    cleanup(current)
  }
})

test('verify-change-docs lists rule levels and hardening conditions', () => {
  const rules = JSON.stringify({
    version: 1,
    rules: [
      {
        when: ['scripts/**/*.ts'],
        owners: ['docs/owner.md'],
        reason: 'fixture ownership',
        level: 'remind',
        hardenWhen: 'again after two misses',
      },
      {
        when: ['package.json'],
        owners: ['docs/owner.md'],
        reason: 'fixture package ownership',
        level: 'require',
      },
    ],
  })
  const current = workspace({
    'scripts/change-doc-rules.json': `${rules}\n`,
    'docs/owner.md': '# Owner\n',
  })
  try {
    const result = current.run('verify-change-docs.ts', ['--list-rules'])
    assert.equal(result.status, 0)
    assert.match(result.stdout, /1 remind \/ 1 require/u)
    assert.match(result.stdout, /\[require\] package\.json/u)
    assert.match(result.stdout, /harden when: again after two misses/u)
  } finally {
    cleanup(current)
  }
})

test('verify-agent-note-format rejects a malformed note', () => {
  const current = workspace({
    '.agents/notes/implemented/process/2026-01-01-sample.md': [
      '# Wrong title',
      '',
      'Status: proposed',
      '',
      '## Problem',
      '',
      'Fixture.',
      '',
    ].join('\n'),
  })
  try {
    const result = current.run('verify-agent-note-format.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /2026-01-01-sample\.md/u)
  } finally {
    cleanup(current)
  }
})

test('verify-tasks rejects status and directory mismatches', () => {
  const task = [
    '---',
    'status: 已交付',
    '---',
    '# 任务：示例',
    '',
    '## 任务目标与背景',
    '', '目标。',
    '',
    '## 关联输入',
    '', '无。',
    '',
    '## 工作范围与验收条件',
    '', '验收。',
    '',
    '## 进展记录',
    '', '进展。',
    '',
    '## 最终交付结果',
    '', '交付。',
    '',
    '## 验证结果',
    '', '验证。',
    '',
    '## 遗留问题',
    '', '无。',
    '',
  ].join('\n')
  const current = workspace({
    '研发任务/README.md': '# 研发任务\n',
    '研发任务/进行中/2026-01-01-示例.md': task,
    '研发任务/归档/已交付/.gitkeep': '',
    '研发任务/归档/已放弃/.gitkeep': '',
    '研发任务/归档/已替代/.gitkeep': '',
  })
  try {
    const result = current.run('verify-tasks.ts')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /does not match its directory/u)
  } finally {
    cleanup(current)
  }
})

test('documentation gates report empty corpora instead of silently failing', () => {
  const current = workspace({
    'docs/empty.md': '# Empty\n',
  })
  try {
    const result = current.run('verify-md-links.ts')
    assert.equal(result.status, 0)
    assert.match(result.stdout, /\d+ file\(s\) checked/u)
  } finally {
    cleanup(current)
  }
})
