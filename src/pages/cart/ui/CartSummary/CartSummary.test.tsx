/**
 * Unit tests for CartSummary component
 * Feature: EPMCDMETST-67098 — Enable Checkout button when cart has items
 *
 * Validates acceptance criteria:
 * - Checkout button is disabled when totalPrice === 0 (cart empty)
 * - Checkout button is enabled when totalPrice > 0 (cart has items)
 * - onCheckout callback is called when the button is clicked (only when enabled)
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartSummary } from './CartSummary'

describe('CartSummary — Checkout button (EPMCDMETST-67098)', () => {
  describe('Acceptance Criterion 1: Checkout button is disabled when cart is empty', () => {
    it('renders the Checkout button as disabled when totalPrice is 0', () => {
      render(<CartSummary totalPrice={0} />)

      const button = screen.getByRole('button', { name: /checkout/i })
      expect(button).toBeDisabled()
    })

    it('does not call onCheckout when the disabled button is clicked', async () => {
      const onCheckout = vi.fn()
      const user = userEvent.setup()

      render(<CartSummary totalPrice={0} onCheckout={onCheckout} />)

      const button = screen.getByRole('button', { name: /checkout/i })
      await user.click(button)

      expect(onCheckout).not.toHaveBeenCalled()
    })
  })

  describe('Acceptance Criterion 2: Checkout button is enabled when cart has items', () => {
    it('renders the Checkout button as enabled when totalPrice > 0', () => {
      render(<CartSummary totalPrice={1000} />)

      const button = screen.getByRole('button', { name: /checkout/i })
      expect(button).toBeEnabled()
    })

    it('is enabled when totalPrice is 1 (minimum non-zero boundary value)', () => {
      render(<CartSummary totalPrice={1} />)

      const button = screen.getByRole('button', { name: /checkout/i })
      expect(button).toBeEnabled()
    })

    it('is enabled when totalPrice is a large value (multiple items)', () => {
      render(<CartSummary totalPrice={99999} />)

      const button = screen.getByRole('button', { name: /checkout/i })
      expect(button).toBeEnabled()
    })
  })

  describe('Acceptance Criterion 3: Checkout navigation callback', () => {
    it('calls onCheckout when the enabled Checkout button is clicked', async () => {
      const onCheckout = vi.fn()
      const user = userEvent.setup()

      render(<CartSummary totalPrice={1000} onCheckout={onCheckout} />)

      const button = screen.getByRole('button', { name: /checkout/i })
      await user.click(button)

      expect(onCheckout).toHaveBeenCalledTimes(1)
    })

    it('renders without onCheckout prop without throwing (optional prop)', () => {
      expect(() => render(<CartSummary totalPrice={1000} />)).not.toThrow()
    })
  })

  describe('CartSummary display (regression)', () => {
    it('displays the Checkout button text', () => {
      render(<CartSummary totalPrice={500} />)
      expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument()
    })

    it('shows the order summary section labels', () => {
      render(<CartSummary totalPrice={500} />)

      expect(screen.getByText(/subtotal/i)).toBeInTheDocument()
      expect(screen.getByText(/estimated delivery/i)).toBeInTheDocument()
      expect(screen.getByText(/taxes/i)).toBeInTheDocument()
      expect(screen.getAllByText(/total/i).length).toBeGreaterThanOrEqual(1)
    })

    it('shows "Free" for estimated delivery', () => {
      render(<CartSummary totalPrice={500} />)
      expect(screen.getByText('Free')).toBeInTheDocument()
    })
  })

  describe('isCheckoutDisabled logic (unit)', () => {
    it('disables checkout exactly when totalPrice equals 0', () => {
      const { rerender } = render(<CartSummary totalPrice={0} />)
      expect(screen.getByRole('button', { name: /checkout/i })).toBeDisabled()

      rerender(<CartSummary totalPrice={1} />)
      expect(screen.getByRole('button', { name: /checkout/i })).toBeEnabled()

      rerender(<CartSummary totalPrice={0} />)
      expect(screen.getByRole('button', { name: /checkout/i })).toBeDisabled()
    })
  })
})
