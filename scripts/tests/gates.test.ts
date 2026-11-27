/**
 * 文档门禁的失败路径测试。门禁在健康输入上通过，
 * 并不能证明它能发现违规，因此每个用例都会构建一个
 * 小型临时工作区，复制门禁脚本，链接仓库已安装的
 * 依赖，并断言无效输入会被拒绝，且给出可定位的
 * 诊断。
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
 * 创建一个临时工作区，包含所有顶层门禁脚本、最小模块
 * package.json、给定的夹具文件，以及指向仓库已安装
 * 依赖的链接。
 * @param files - 仓库相对的夹具路径及其内容。
 * @returns 工作区句柄。
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

/** 在工作区中初始化 Git，使按变更范围运行的门禁有基线。 */
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

/** 返回测试工作区的当前提交哈希。 */
function headCommit(current: Workspace): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: current.dir, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git rev-parse HEAD failed: ${result.stderr ?? ''}`)
  return (result.stdout ?? '').trim()
}

/** 删除工作区（含其依赖 junction），且不跟随该链接。 */
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

test('verify-module-readmes accepts 摘要 and rejects the English heading', () => {
  const moduleDoc = [
    '---',
    'description: "Fixture module."',
    'kind: "module"',
    '---',
    '# Fixture',
    '',
    '## 摘要',
    '',
    'Fixture summary.',
    '',
    '## 已知限制与暂缓工作',
    '',
    '- None.',
    '',
  ].join('\n')
  const current = workspace({ 'mods/widget/README.md': moduleDoc })
  try {
    const accepted = current.run('verify-module-readmes.ts')
    assert.equal(accepted.status, 0)

    writeFileSync(join(current.dir, 'mods/widget/README.md'), moduleDoc.replace('## 摘要', '## Summary'))
    const rejected = current.run('verify-module-readmes.ts')
    assert.equal(rejected.status, 1)
    assert.match(rejected.stderr, /缺少 ## 摘要/u)
  } finally {
    cleanup(current)
  }
})

const digest = 'a'.repeat(64)

function persistenceChangeDoc(): string {
  return [
    '---',
    'description: "Fixture change."',
    'kind: "persistence-change"',
    '---',
    '# 持久化变更：fixture',
    '',
    '## 摘要',
    '',
    'Fixture summary.',
    '',
    '## 目录',
    '',
    '- [机器声明](#机器声明)',
    '- [兼容性](#兼容性)',
    '- [验证](#验证)',
    '- [开发备注](#开发备注)',
    '',
    '## 机器声明',
    '',
    '```yaml persistence-change',
    'schemaVersion: 1',
    'id: 2026-01-01-fixture',
    'baseline: false',
    'changes:',
    '  - root: state',
    '    previous: null',
    '    after: null',
    '    decision: same-version',
    '```',
    '',
    '## 兼容性',
    '',
    'Fixture.',
    '',
    '## 验证',
    '',
    'None.',
    '',
    '## 开发备注',
    '',
    'None.',
    '',
  ].join('\n')
}

function persistenceReleaseDoc(): string {
  return [
    '---',
    'description: "Fixture release."',
    'kind: "persistence-release"',
    '---',
    '# 持久化发布：v1.0.0',
    '',
    '## 摘要',
    '',
    'Fixture summary.',
    '',
    '## 目录',
    '',
    '- [发布证据](#发布证据)',
    '- [机器声明](#机器声明)',
    '- [结构变更](#结构变更)',
    '- [验证](#验证)',
    '- [开发备注](#开发备注)',
    '',
    '## 发布证据',
    '',
    'Fixture.',
    '',
    '## 机器声明',
    '',
    '```yaml persistence-release',
    'schemaVersion: 1',
    'tag: v1.0.0',
    'previous: null',
    'formatVersion: 1',
    'changes: []',
    '```',
    '',
    '## 结构变更',
    '',
    'None.',
    '',
    '## 验证',
    '',
    'None.',
    '',
    '## 开发备注',
    '',
    'None.',
    '',
  ].join('\n')
}

function persistenceFormatDoc(): string {
  return [
    '---',
    'description: "Fixture format."',
    'kind: "persistence-format"',
    '---',
    '# 历史格式：v1',
    '',
    '## 摘要',
    '',
    'Fixture summary.',
    '',
    '## 目录',
    '',
    '- [源码证据](#源码证据)',
    '- [格式特征](#格式特征)',
    '- [机器声明](#机器声明)',
    '- [完整 schema](#完整-schema)',
    '- [验证与限制](#验证与限制)',
    '- [开发备注](#开发备注)',
    '',
    '## 源码证据',
    '',
    'Fixture.',
    '',
    '## 格式特征',
    '',
    'Fixture.',
    '',
    '## 机器声明',
    '',
    '```yaml persistence-format',
    'schemaVersion: 1',
    'formatVersion: 1',
    'source:',
    '  tag: v1.0.0',
    'roots:',
    `  state: ${digest}`,
    '```',
    '',
    '## 完整 schema',
    '',
    '<!-- persistence-format-schema:start -->',
    '<!-- persistence-format-schema:end -->',
    '',
    '## 验证与限制',
    '',
    'None.',
    '',
    '## 开发备注',
    '',
    'None.',
    '',
  ].join('\n')
}

const persistenceCases = [
  {
    kind: 'persistence-change',
    path: 'docs/persistence-changes/2026-01-01-fixture.md',
    content: persistenceChangeDoc,
    extra: {},
    heading: '## 兼容性',
    englishHeading: '## Compatibility',
    missing: '## 兼容性',
  },
  {
    kind: 'persistence-release',
    path: 'docs/persistence-changes/releases/v1.0.0.md',
    content: persistenceReleaseDoc,
    extra: {},
    heading: '## 机器声明',
    englishHeading: '## Declaration',
    missing: '## 机器声明',
  },
  {
    kind: 'persistence-format',
    path: 'docs/persistence-changes/historical-formats/v1.md',
    content: persistenceFormatDoc,
    extra: { 'docs/persistence-changes/historical-formats/v1.schema.json': '{}\n' },
    heading: '## 验证与限制',
    englishHeading: '## Verification',
    missing: '## 验证与限制',
  },
] as const

for (const fixture of persistenceCases) {
  test(`verify-persistence-records accepts Chinese headings and rejects English for ${fixture.kind}`, () => {
    const current = workspace({ ...fixture.extra, [fixture.path]: fixture.content() })
    try {
      const accepted = current.run('verify-persistence-records.ts')
      assert.equal(accepted.status, 0)

      writeFileSync(
        join(current.dir, fixture.path),
        fixture.content().replace(fixture.heading, fixture.englishHeading),
      )
      const rejected = current.run('verify-persistence-records.ts')
      assert.equal(rejected.status, 1)
      assert.match(rejected.stderr, new RegExp(`missing ${fixture.missing}`, 'u'))
    } finally {
      cleanup(current)
    }
  })
}

test('documentation gates report empty corpora instead of silently passing', () => {
  const current = workspace({
    '.agents/notes/archived/AGENTS.md': '# Archived notes\n',
    '.agents/notes/archived/manifest.json': '{"version":1,"files":{}}\n',
  })
  const cases = [
    ['verify-module-readmes.ts', /0 module\(s\) and 0 module group\(s\)/u],
    ['verify-module-groups.ts', /0 module group doc\(s\)/u],
    ['verify-persistence-records.ts', /0 record\(s\).*0 change/u],
    ['verify-generated-docs.ts', /0 document\(s\)/u],
    ['verify-subsystem-pages.ts', /0 unit\(s\)/u],
    ['verify-archived-agent-notes.ts', /0 frozen artifact/u],
  ] as const
  try {
    initGit(current, true)
    for (const [script, expected] of cases) {
      const result = current.run(script)
      assert.equal(result.status, 0, `${script}: ${result.stderr}`)
      assert.match(result.stdout, expected)
    }
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
