/** 文档门禁共用的计数规则。 */

/** 按单字计数的 CJK 字符：汉字、平假名、片假名和谚文。 */
const CJK_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu

/**
 * 按 CJK 字符与空白混合的规则统计文档单位数。
 * 每个 CJK 字符计为一个单位；其余文本按空白分隔的片段计数，
 * 每个 CJK 字符同时充当分隔符。
 * @param text - 待度量的文档文本。
 * @returns CJK 字符数加上空白分隔的非 CJK 片段数。
 */
export function countDocumentUnits(text: string): number {
  let cjk = 0
  const remainder = text.replace(CJK_CHARACTER, () => {
    cjk += 1
    return ' '
  })
  return cjk + remainder.split(/\s+/).filter(Boolean).length
}

/**
 * 按词当量统计模块 Summary 的字数上限。
 * 英文文本按空白分隔的片段每个计一个单位；CJK 文本每两个字符计一个单位，
 * 从而三到五句的中文 Summary 与 100 个英文单词
 * 使用同一尺度度量。
 * @param text - 待度量的 Summary 正文。
 * @returns 空白分隔片段数加上 CJK 字符数的一半，向上取整。
 */
export function countWordEquivalents(text: string): number {
  let cjk = 0
  const remainder = text.replace(CJK_CHARACTER, () => {
    cjk += 1
    return ' '
  })
  return remainder.split(/\s+/).filter(Boolean).length + Math.ceil(cjk / 2)
}
