import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { selectCartTotalPrice, selectProductsInCart } from '@/entities/cart'
import { formatPrice } from '@/shared/lib'
import { useAppSelector } from '@/shared/lib/redux'
import { Button } from '@/shared/ui'
import css from './Page.module.css'

export function CheckoutPage() {
  const navigate = useNavigate()
  const totalPrice = useAppSelector(selectCartTotalPrice)
  const cartProducts = useAppSelector(selectProductsInCart)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const handleContinueShopping = () => {
    navigate('/')
  }

  if (cartProducts.length === 0) {
    return (
      <div data-fsd="page/checkout/Page" className={css.root}>
        <h1>Checkout</h1>
        <div className={css.emptyState}>
          <p>Your cart is empty. Add items before checking out.</p>
          <Button onClick={handleContinueShopping}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div data-fsd="page/checkout/Page" className={css.root}>
        <h1>Order Confirmed</h1>
        <div className={css.confirmation}>
          <p className={css.confirmationMessage}>
            Your order has been placed successfully!
          </p>
          <p className={css.confirmationTotal}>
            {'Order total: '}
            {formatPrice(totalPrice)}
          </p>
          <Button onClick={handleContinueShopping}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div data-fsd="page/checkout/Page" className={css.root}>
      <h1>Checkout</h1>
      <div className={css.summary}>
        <div className={css.summaryRow}>
          <span>Order Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className={css.actions}>
          <Button onClick={() => setOrderPlaced(true)}>Place Order</Button>
          <Button variant="secondary" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}
