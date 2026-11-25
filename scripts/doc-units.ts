/** Counting rules shared by documentation gates. */

/** CJK characters counted individually: Han, hiragana, katakana, and hangul. */
const CJK_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu

/**
 * Count documentation units under the hybrid CJK/whitespace rule.
 * Each CJK character counts as one unit; all other text counts one unit per
 * whitespace-delimited token, with each CJK character acting as a separator.
 * @param text - Document text to measure.
 * @returns CJK character count plus whitespace-delimited non-CJK token count.
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
 * Count word equivalents for the module Summary limit.
 * English text counts one unit per whitespace-delimited token; CJK text counts
 * one unit per two characters, so a three-to-five sentence Chinese Summary is
 * measured on the same scale as 100 English words.
 * @param text - Summary body to measure.
 * @returns Whitespace tokens plus half the CJK character count, rounded up.
 */
export function countWordEquivalents(text: string): number {
  let cjk = 0
  const remainder = text.replace(CJK_CHARACTER, () => {
    cjk += 1
    return ' '
  })
  return remainder.split(/\s+/).filter(Boolean).length + Math.ceil(cjk / 2)
}
