import { describe, it, expect } from 'vitest'
import { validate, type ValidationError } from '../schema'
import { getCardType } from '../registry'
import { productSchema } from '../product/product.schema'

/**
 * Agent 監督能力的可執行示範。
 *
 * 重點：schema descriptor 本身就是機器可讀的（欄位/型別/必填都是純資料），
 * 所有輸出都經過同一個 validate() 並回**結構化錯誤**，因此一個 agent 可以
 * 「產生 → 自我檢查 → 自我修正」，人類只需監督這個迴圈。
 */

describe('agent supervision loop', () => {
  it('exposes a machine-readable schema descriptor for the agent', () => {
    const def = getCardType('product')
    const keys = def?.schema.fields.map((f) => f.key) ?? []
    expect(keys).toEqual(expect.arrayContaining(['variant', 'title', 'price', 'images']))
    // 必填等限制是宣告式的純資料，agent 直接讀得到。
    const title = def?.schema.fields.find((f) => f.key === 'title')
    expect(title?.requiredIn).toBe('all')
  })

  it('lets an agent self-correct from structured errors', () => {
    // 1) agent 產生一筆有錯的卡片：缺 rank、price 是文字。
    const candidate: Record<string, unknown> = {
      variant: 'ranking',
      title: '【PLAYBOY】手提包',
      images: ['https://example.com/a.webp'],
      price: 'about a thousand',
    }

    // 2) 驗證 → 拿到結構化錯誤。
    let result = validate(productSchema, candidate)
    expect(result.valid).toBe(false)

    // 3) agent 依 error.path / error.expected 自我修正。
    const fix = (e: ValidationError) => {
      if (e.path === 'price' && e.expected === 'number') candidate.price = 968
      if (e.path === 'rank') candidate.rank = 'TOP1'
    }
    result.errors.forEach(fix)

    // 4) 再驗證 → 通過。
    result = validate(productSchema, candidate)
    expect(result.valid).toBe(true)
  })
})
