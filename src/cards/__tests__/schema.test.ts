import { describe, it, expect } from 'vitest'
import { validate } from '../schema'
import { productSchema } from '../product/product.schema'

const validRanking = {
  variant: 'ranking',
  rank: 'TOP1',
  brand: 'PLAYBOY',
  title: '【PLAYBOY】手提包',
  promoText: '滿1000折150',
  images: ['https://example.com/a.webp'],
  price: 968,
  rating: 4.7,
  reviewCount: 17,
  salesText: '總銷量>100',
  tags: ['折價券'],
}

const validStandard = {
  variant: 'standard',
  brand: 'PLAYBOY',
  title: '【PLAYBOY】後背包',
  promoText: '滿1000折150',
  images: ['https://example.com/a.webp', 'https://example.com/b.webp'],
  price: 3130,
  originalPrice: 3580,
  rating: 4.8,
  reviewCount: 63,
  tags: ['折價券', '登記'],
  actions: ['cart', 'wishlist'],
}

describe('validate (variant-aware)', () => {
  it('accepts valid ranking and standard cards', () => {
    expect(validate(productSchema, validRanking).valid).toBe(true)
    expect(validate(productSchema, validStandard).valid).toBe(true)
  })

  it('rejects an invalid variant', () => {
    const res = validate(productSchema, { ...validStandard, variant: 'banner' })
    expect(res.valid).toBe(false)
    expect(res.errors[0].path).toBe('variant')
  })

  it('requires rank in the ranking variant', () => {
    const { rank, ...noRank } = validRanking
    void rank
    const res = validate(productSchema, noRank)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.path === 'rank')).toBe(true)
  })

  it('rejects originalPrice on ranking (not applicable to variant)', () => {
    const res = validate(productSchema, { ...validRanking, originalPrice: 1200 })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.path === 'originalPrice')).toBe(true)
  })

  it('rejects a non-number price with a structured error', () => {
    const res = validate(productSchema, { ...validStandard, price: 'lots' })
    expect(res.valid).toBe(false)
    const err = res.errors.find((e) => e.path === 'price')
    expect(err?.expected).toBe('number')
    expect(err?.received).toBe('lots')
  })

  it('enforces number range (rating <= 5)', () => {
    const res = validate(productSchema, { ...validStandard, rating: 9 })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.path === 'rating')).toBe(true)
  })

  it('flags unknown fields (typo defence)', () => {
    const res = validate(productSchema, { ...validStandard, titel: 'oops' })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.path === 'titel')).toBe(true)
  })
})
