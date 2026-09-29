/**
 * Unit tests for CartPage component
 * Feature: EPMCDMETST-67098 — Enable Checkout button when cart has items
 *
 * Validates:
 * - Checkout button navigation handler: navigates to /user/checkout
 * - CartSummary receives the correct onCheckout callback
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartPage } from './Page'
import { renderWithProviders, makeCartLine, makeProduct } from '@/test/test-utils'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the API query used by CartPage (useGetCartQuery) to avoid real API calls
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    useGetCartQuery: () => ({ isLoading: false, data: undefined }),
  }
})

// Mock the session selector to simulate an authorized user
vi.mock('@/entities/session', async () => {
  const actual = await vi.importActual('@/entities/session')
  return {
    ...actual,
    selectIsAuthorized: () => true,
  }
})

describe('CartPage — checkout navigation (EPMCDMETST-67098)', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('Empty cart state (authorized user)', () => {
    it('shows an empty bag message when cart has no items', () => {
      renderWithProviders(<CartPage />, {
        cartLines: [],
      })

      expect(
        screen.getByText(/there are no products in your bag/i),
      ).toBeInTheDocument()
    })

    it('shows Browse products button when cart is empty', () => {
      renderWithProviders(<CartPage />, {
        cartLines: [],
      })

      expect(
        screen.getByRole('button', { name: /browse products/i }),
      ).toBeInTheDocument()
    })

    it('does not show Checkout button when cart is empty (CartSummary not rendered)', () => {
      renderWithProviders(<CartPage />, {
        cartLines: [],
      })

      // CartSummary (and Checkout button) is only rendered when cart has items
      expect(
        screen.queryByRole('button', { name: /checkout/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Cart with items state — handleCheckoutClick', () => {
    it('shows the Checkout button when cart has items', () => {
      const cartLines = [makeCartLine()]

      renderWithProviders(<CartPage />, { cartLines })

      expect(
        screen.getByRole('button', { name: /checkout/i }),
      ).toBeInTheDocument()
    })

    it('enables the Checkout button when cart has items (totalPrice > 0)', () => {
      const cartLines = [makeCartLine(makeProduct({ price: 500 as Penny }))]

      renderWithProviders(<CartPage />, { cartLines })

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      expect(checkoutButton).toBeEnabled()
    })

    it('navigates to /user/checkout when the enabled Checkout button is clicked', async () => {
      const cartLines = [makeCartLine()]
      const user = userEvent.setup()

      renderWithProviders(<CartPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /checkout/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/user/checkout')
    })

    it('navigates to /user/checkout — multiple items in cart', async () => {
      const cartLines = [
        makeCartLine(makeProduct({ id: 1 as ProductId, price: 500 as Penny })),
        makeCartLine(makeProduct({ id: 2 as ProductId, price: 750 as Penny })),
      ]
      const user = userEvent.setup()

      renderWithProviders(<CartPage />, { cartLines })

      await user.click(screen.getByRole('button', { name: /checkout/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/user/checkout')
    })
  })
})
