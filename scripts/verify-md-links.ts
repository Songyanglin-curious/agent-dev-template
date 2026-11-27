/**
 * 校验相对 Markdown 链接、图片和定义能否解析：目标文件
 * 必须存在，且指向 Markdown 目标的 `#fragment`（包括
 * 同文件的 `#anchor`）必须对应真实的标题 slug 或显式
 * `<a id>`。URL 和根绝对目标不检查；查询字符串不影响
 * 相对源文件的解析。检查器从不改写，符号链接文件会被
 * 去重。
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import type { Nodes } from 'mdast'
import { markdownSourcePaths } from './doc-tooling.ts'
import { markdownHeadingLines, parseMarkdown, visitMarkdown } from './markdown.ts'

const root = resolve(import.meta.dirname, '..')

/**
 * 发现仓库中编写的 Markdown 源文件，并对符号链接去重。该语料
 * 与其他结构门禁共享，因此模块 README 也会被检查。
 * @returns 相对仓库根目录、使用正斜杠的源文件路径。
 */
export function markdownLinkSourcePaths(): string[] {
  return markdownSourcePaths()
}

/** 一条失效的相对链接：目标路径缺失或其上的锚点缺失。 */
interface Violation {
  file: string
  /** 链接/图片/定义节点起始的 1 基行号。 */
  line: number
  url: string
  /** 失败的部分：目标文件还是其上的片段。 */
  reason: 'target' | 'anchor'
}

/**
 * 对本门禁不得检查的目标返回 true：带协议的 URL（`https:`、
 * `mailto:` 等）、协议相对（`//host`）以及根绝对路径（`/path`）。
 * 纯页面内锚点（`#frag`）会被检查，针对源文件自身。
 */
function isExternal(url: string): boolean {
  if (url.startsWith('//')) return true
  if (url.startsWith('/')) return true
  // `https:` / `mailto:` 这类协议——冒号出现在任何斜杠、点或井号之前。
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)
}

/**
 * 从链接目标中去掉 `#fragment` 和 `?query`，再对剩余路径做
 * 百分号解码，使编码过的目标（`My%20File.md`、`READ%4DE.md`）能
 * 探测磁盘上的真实文件名，与 Markdown 渲染器的解析方式一致。
 * 格式错误的转义（`%zz`）会让 `decodeURIComponent` 抛异常；此时
 * 保留原始路径，使链接被报告为失效（`%zz` 目标不是任何人想要
 * 链接的文件），而不是让门禁崩溃。
 */
function pathPart(url: string): string {
  const raw = url.replace(/[#?].*$/, '')
  try {
    return decodeURIComponent(raw)
  } catch {
    // decodeURIComponent 只在百分号转义格式错误时抛异常；此时原始
    // 字符串是任何渲染器都无法解析的路径，因此继续执行存在性
    // 检查，由该检查报告为失效。
    return raw
  }
}

/** 链接目标经过百分号解码的 `#fragment`，没有片段时为 null。 */
function fragmentPart(url: string): string | null {
  const hash = url.indexOf('#')
  if (hash === -1) return null
  const raw = url.slice(hash + 1).replace(/\?.*$/, '')
  try {
    return decodeURIComponent(raw)
  } catch {
    // 与 pathPart 立场相同：格式错误的转义不对应任何人想要的
    // 锚点，因此原始文本进入查找并被报告为缺失。
    return raw
  }
}

/**
 * GitHub 的标题 slug 算法（转为小写；只保留字母、数字、
 * 下划线、空格和连字符；空格转为连字符）。下划线会保留
 * （`## Showcase: web_fetch` → `#showcase-web_fetch`）。文档若还
 * 发布了显式 `<a id>` 锚点，则不必遵循此规则；这些锚点会被
 * 单独收集。
 * @param heading - 渲染后的标题文本（Markdown 语法已去除）。
 * @returns GitHub 为标题首次出现分配的锚点。
 */
export function githubSlug(heading: string): string {
  return heading.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-')
}

/**
 * 单个 Markdown 文档暴露的全部锚点：每个标题的 GitHub slug——
 * 由渲染后的标题文本计算，因此标题中的链接、图片、行内代码和
 * 强调会按 GitHub 的呈现方式参与 slug——再加上真实 HTML 流中
 * 出现的每个显式 `<a id="…">`（围栏或行内代码样例以及被注释掉
 * 的锚点都不会注册）。重复的 slug 会获得 GitHub 占用集合的
 * `-1`、`-2` 等后缀：每次冲突都会递增原始 slug 的计数器，
 * 直到找到空闲名称，因此 `Repeat`、`Repeat-1`、`Repeat` 得到
 * `repeat`、`repeat-1`、`repeat-2`。匹配是精确的——元素 id 区分
 * 大小写。
 * @param source - 文档的完整 Markdown 文本。
 * @param tree - 当调用方已持有时，恰好针对 `source` 的 GFM 解析结果。
 * @returns 指向本文档的链接可用的片段集合。
 */
export function documentAnchors(source: string, tree: Nodes = parseMarkdown(source)): Set<string> {
  const anchors = new Set<string>()
  const occurrences = new Map<string, number>()
  for (const heading of markdownHeadingLines(source, tree)) {
    const base = githubSlug(heading.text)
    let result = base
    let bump = occurrences.get(base) ?? 0
    while (anchors.has(result)) {
      bump += 1
      result = `${base}-${bump}`
    }
    occurrences.set(base, bump)
    anchors.add(result)
  }
  visitMarkdown(tree, (node: Nodes): void => {
    if (node.type !== 'html') return
    const html = node.value.replace(/<!--[\s\S]*?-->/g, '')
    for (const match of html.matchAll(/<a id="([^"]+)"/g)) anchors.add(match[1] ?? '')
  })
  return anchors
}

/** 一个 Markdown 文件的链接输入与暴露的锚点，来自同一次解析。 */
export interface MarkdownLinkDocument {
  /** 链接、图片和定义的目标及其 1 基起始行号，按文档顺序。 */
  destinations: { url: string; line: number }[]
  /** 指向本文档的链接可以使用的片段。 */
  anchors: Set<string>
}

/** 每次运行中由所有被扫描源文件和链接目标共享的读取、解析与目标探测。 */
export interface MarkdownLinkCache {
  /** 每次运行中每个 Markdown 文件最多读取并解析一次。 */
  document: (absPath: string) => MarkdownLinkDocument
  /** 解析后的链接目标是否存在，每个路径最多探测一次。 */
  exists: (absPath: string) => boolean
}

function markdownLinkDocument(source: string): MarkdownLinkDocument {
  const tree = parseMarkdown(source)
  const destinations: MarkdownLinkDocument['destinations'] = []
  visitMarkdown(tree, (node: Nodes): void => {
    if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && 'url' in node) {
      destinations.push({ url: node.url, line: node.position?.start.line ?? 0 })
    }
  })
  return { destinations, anchors: documentAnchors(source, tree) }
}

/**
 * 为一次检查器运行创建带缓存的文件读取与存在性探测。
 * 既是扫描源又是片段目标的文件只解析一次；假定运行期间
 * 仓库不会发生变化。
 * @returns 传给本次运行每次 {@link findViolations} 调用的缓存。
 */
export function markdownLinkCache(): MarkdownLinkCache {
  const documents = new Map<string, MarkdownLinkDocument>()
  const existence = new Map<string, boolean>()
  return {
    document: (absPath) => {
      const hit = documents.get(absPath)
      if (hit) return hit
      const document = markdownLinkDocument(readFileSync(absPath, 'utf8'))
      documents.set(absPath, document)
      return document
    },
    exists: (absPath) => {
      const hit = existence.get(absPath)
      if (hit !== undefined) return hit
      const exists = existsSync(absPath)
      existence.set(absPath, exists)
      return exists
    },
  }
}

/**
 * 通过 AST 找出一个 Markdown 文件中所有失效的相对交叉链接：
 * 不存在的相对目标，或指向 Markdown 文件的片段（包括同文件的
 * `#anchor` 链接）在该文件中没有对应任何标题 slug 或显式
 * `<a id>`。指向非 Markdown 目标（`file.ts#L10`）的片段带有
 * 渲染器自身的语义，不做判定。
 * @param absPath - 要扫描的 Markdown 源文件的绝对路径。
 * @param cache - 交叉链接检查中跨文件共享的解析与目标探测。
 * @param scanRoot - 违规报告所相对的仓库根目录。
 * @returns 每条失效链接一条记录，按文档顺序。
 */
export function findViolations(
  absPath: string,
  cache: MarkdownLinkCache = markdownLinkCache(),
  scanRoot: string = root,
): Violation[] {
  const file = relative(scanRoot, absPath).split(sep).join('/')
  const dir = dirname(absPath)
  const out: Violation[] = []
  for (const { url, line } of cache.document(absPath).destinations) {
    if (isExternal(url)) continue
    const target = pathPart(url)
    const resolved = target === '' ? absPath : resolve(dir, target)
    if (!cache.exists(resolved)) {
      out.push({ file, line, url, reason: 'target' })
      continue
    }
    const fragment = fragmentPart(url)
    if (fragment === null || !resolved.endsWith('.md')) continue
    if (!cache.document(resolved).anchors.has(fragment)) {
      out.push({ file, line, url, reason: 'anchor' })
    }
  }
  return out
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  const files = markdownLinkSourcePaths()
  const cache = markdownLinkCache()
  const all = files.flatMap(file => findViolations(resolve(root, file), cache))
  const checked = files.length

  if (all.length === 0) {
    console.log(`verify-md-links: ${checked} file(s) checked, all relative cross-links and fragments resolve.`)
    process.exit(0)
  }

  console.error('verify-md-links: broken relative cross-links found:')
  for (const v of all) {
    console.error(`  ${v.file}:${v.line}  ${v.url}  (${v.reason === 'target' ? 'target does not exist' : 'no such anchor in target'})`)
  }
  process.exit(1)
}
