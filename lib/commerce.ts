// Commerce-rate config used by cart/checkout. Mirrors the backend so the
// quoted totals match what `orderService.createOrder` will charge. Keep the
// values in sync with `express-postgres-project/src/config/constants.js`.

export type ShippingMethod = 'standard' | 'express' | 'overnight'

export const SHIPPING_RATES: Record<ShippingMethod, number> = {
  standard: 0,
  express: 18,
  overnight: 32,
}

export const SHIPPING_DESCRIPTIONS: Record<
  ShippingMethod,
  { label: string; detail: string; price: string }
> = {
  standard: { label: 'Standard', detail: '5–7 business days', price: 'Free' },
  express: { label: 'Express', detail: '2 business days', price: '$18.00' },
  overnight: {
    label: 'Carbon-neutral overnight',
    detail: 'Next day',
    price: '$32.00',
  },
}

export const TAX_RATE = 0.08
export const FREE_SHIPPING_THRESHOLD = 80

// Pure helpers — used by cart preview and checkout summary so a single rule
// drives both screens.
export const calcTax = (taxableSubtotal: number): number =>
  Math.round(taxableSubtotal * TAX_RATE * 100) / 100

export const qualifiesForFreeShipping = (subtotal: number): boolean =>
  subtotal >= FREE_SHIPPING_THRESHOLD
