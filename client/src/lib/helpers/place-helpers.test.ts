import { describe, expect, it } from 'vitest'
import {
  extractPrimaryBusinessType,
  formatGooglePlaceType,
} from './place-helpers'

describe('formatGooglePlaceType', () => {
  it('formats underscore-separated Google place types', () => {
    expect(formatGooglePlaceType('beauty_salon')).toBe('Beauty Salon')
  })

  it('uses a generic label when no type is provided', () => {
    expect(formatGooglePlaceType()).toBe('local business')
  })
})

describe('extractPrimaryBusinessType', () => {
  it('selects the first non-generic business category', () => {
    expect(
      extractPrimaryBusinessType([
        'point_of_interest',
        'restaurant',
        'food',
      ]),
    ).toBe('Restaurant')
  })

  it('uses the generic label for an empty list', () => {
    expect(extractPrimaryBusinessType([])).toBe('local business')
  })
})
