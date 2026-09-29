/**
 * Unit tests for CheckoutPage component
 * Feature: EPMCDMETST-67098 — Enable Checkout button when cart has items
 *
 * Validates:
 * - Empty cart state: shows empty message with Continue Shopping button
 * - Cart with items state: shows Order Total and Place Order button
 * - Place Order action: transitions to order confirmation state
 * - Continue Shopping: navigates back to home
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CheckoutPage } from './Page'
import { renderWithProviders, makeProduct, makeCartLine } from '@/test/test-utils'

// Mock useNavigate to capture navigation calls
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('CheckoutPage (EPMCDMETST-67098)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('Empty cart state', () => {
    it('shows an empty-cart message when cart has no items', () => {
      renderWithProviders(<CheckoutPage />, { cartLines: [] })

      expect(
        screen.getByText(/your cart is empty/i),
      ).toBeInTheDocument()
    })

    it('shows Continue Shopping button when cart is empty', () => {
      renderWithProviders(<CheckoutPage />, { cartLines: [] })

      expect(
        screen.getByRole('button', { name: /continue shopping/i }),
      ).toBeInTheDocument()
    })

    it('does not show Place Order button when cart is empty', () => {
      renderWithProviders(<CheckoutPage />, { cartLines: [] })

      expect(
        screen.queryByRole('button', { name: /place order/i }),
      ).not.toBeInTheDocument()
    })

    it('shows Checkout heading when cart is empty', () => {
      renderWithProviders(<CheckoutPage />, { cartLines: [] })

      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument()
    })
  })

  describe('Cart with items state', () => {
    it('shows Order Total when cart has items', () => {
      const cartLines = [makeCartLine(makeProduct({ price: 1000 as Penny }))]

      renderWithProviders(<CheckoutPage />, { cartLines })

      expect(screen.getByText(/order total/i)).toBeInTheDocument()
    })

    it('shows Place Order button when cart has items', () => {
      const cartLines = [makeCartLine()]

      renderWithProviders(<CheckoutPage />, { cartLines })

      expect(
        screen.getByRole('button', { name: /place order/i }),
      ).toBeInTheDocument()
    })

    it('shows Continue Shopping button when cart has items', () => {
      const cartLines = [makeCartLine()]

      renderWithProviders(<CheckoutPage />, { cartLines })

      expect(
        screen.getByRole('button', { name: /continue shopping/i }),
      ).toBeInTheDocument()
    })

    it('shows Checkout heading when cart has items', () => {
      const cartLines = [makeCartLine()]

      renderWithProviders(<CheckoutPage />, { cartLines })

      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument()
    })
  })

  describe('Place Order flow — Acceptance Criterion 3', () => {
    it('transitions to order confirmation state when Place Order is clicked', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines })

      const placeOrderButton = screen.getByRole('button', { name: /place order/i })
      await user.click(placeOrderButton)

      // Should show confirmation heading or message
      expect(
        screen.getByText(/order (confirmed|placed)/i),
      ).toBeInTheDocument()
    })

    it('shows Continue Shopping button in order confirmation state', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /place order/i }))

      expect(
        screen.getByRole('button', { name: /continue shopping/i }),
      ).toBeInTheDocument()
    })

    it('hides Place Order button after order is placed', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /place order/i }))

      expect(
        screen.queryByRole('button', { name: /place order/i }),
      ).not.toBeInTheDocument()
    })

    it('displays the "Order Confirmed" heading after placing order', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /place order/i }))

      expect(screen.getByRole('heading', { name: /order confirmed/i })).toBeInTheDocument()
    })
  })

  describe('Continue Shopping navigation', () => {
    it('navigates to "/" when Continue Shopping is clicked from checkout page', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /continue shopping/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('navigates to "/" when Continue Shopping is clicked from empty cart state', async () => {
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines: [] })

      await user.click(screen.getByRole('button', { name: /continue shopping/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('navigates to "/" when Continue Shopping is clicked from confirmation state', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CheckoutPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /place order/i }))
      await user.click(screen.getByRole('button', { name: /continue shopping/i }))

      expect(mockNavigate).toHaveBeenLastCalledWith('/')
    })
  })
})
