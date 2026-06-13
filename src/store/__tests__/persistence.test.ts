import { describe, it, expect } from 'vitest'
import { migrate, sanitize, SCHEMA_VERSION } from '../persistence'
import type { CardRecord } from '../../cards/schema'

describe('migrate (v0 → v1)', () => {
  it('upgrades the old single-image / badges shape to images / tags', () => {
    const v0 = {
      version: 0,
      cards: [
        {
          id: 'product-standard-1',
          type: 'product',
          data: {
            variant: 'standard',
            title: '舊資料',
            image: 'https://example.com/a.webp', // 舊：單數 image
            badges: ['折價券', '登記'], // 舊名 badges
            price: 1268,
            originalPrice: 2980,
          },
        },
      ],
    }

    const result = migrate(v0)
    expect(result.version).toBe(SCHEMA_VERSION)

    const data = result.cards[0].data as Record<string, unknown>
    expect(data.images).toEqual(['https://example.com/a.webp'])
    expect(data.tags).toEqual(['折價券', '登記'])
    expect(data.image).toBeUndefined()
    expect(data.badges).toBeUndefined()
  })

  it('treats version-less / bare-array data as v0 and upgrades it', () => {
    const bare = [
      { id: 'x', type: 'product', data: { variant: 'standard', image: 'u', title: 't', price: 1 } },
    ]
    const result = migrate(bare)
    expect(result.version).toBe(SCHEMA_VERSION)
    expect((result.cards[0].data as Record<string, unknown>).images).toEqual(['u'])
  })

  it('leaves already-current v1 data unchanged', () => {
    const v1 = {
      version: 1,
      cards: [{ id: 'x', type: 'product', data: { variant: 'standard', images: ['u'], title: 't', price: 1 } }],
    }
    expect(migrate(v1).cards[0].data).toEqual(v1.cards[0].data)
  })
})

describe('sanitize', () => {
  it('keeps valid cards and drops invalid / unknown-type ones', () => {
    const cards: CardRecord[] = [
      {
        id: 'ok',
        type: 'product',
        data: { variant: 'standard', title: 't', images: ['u'], price: 1, tags: [] },
      },
      // 缺 title → 無效
      { id: 'bad', type: 'product', data: { variant: 'standard', images: ['u'], price: 1 } },
      // 未知卡型 → 無對應 schema
      { id: 'unknown', type: 'nope', data: {} },
    ]
    const kept = sanitize(cards)
    expect(kept.map((c) => c.id)).toEqual(['ok'])
  })
})
