/**
 * Test utilities for EPMCDMETST-67098
 * Provides a customizable Redux store wrapper and render helpers for unit tests.
 */
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { makeStore } from '@/shared/lib/redux'
import { cartSlice } from '@/entities/cart/model/slice'
import { sessionSlice } from '@/entities/session'
import type { CartLine } from '@/entities/cart'
import type { Product, ProductId } from '@/entities/product/@x/cart'

/** Create a Product fixture for tests */
export function makeProduct(overrides?: Partial<Product>): Product {
  return {
    id: 1 as ProductId,
    name: 'Test Product',
    subname: 'Test Subname',
    label: 'test',
    stock: 10,
    price: 1000 as Penny,
    image: 'https://example.com/test.png',
    ...overrides,
  }
}

/** Create a CartLine fixture for tests */
export function makeCartLine(product?: Product, quantity = 1): CartLine {
  return {
    product: product ?? makeProduct(),
    quantity,
  }
}

type RenderOptions = {
  /** Initial cart lines to populate the store with */
  cartLines?: CartLine[]
  /** Whether the user should be authenticated (default: true) */
  isAuthorized?: boolean
  /** Initial URL for MemoryRouter */
  initialPath?: string
}

/**
 * Renders a component with a real Redux store (non-persisted) and MemoryRouter.
 * Use cartLines to pre-populate the cart state.
 * Use isAuthorized to control auth state (default: true for most tests).
 */
export function renderWithProviders(
  ui: ReactNode,
  { cartLines = [], isAuthorized = true, initialPath = '/' }: RenderOptions = {},
) {
  // Inject slices so their selectors work (lazy-loaded slice pattern)
  // eslint-disable-next-line no-unused-expressions
  cartSlice
  // eslint-disable-next-line no-unused-expressions
  sessionSlice

  const store = makeStore({ persisted: false })

  // Set up session state if authorized
  if (isAuthorized) {
    // Dispatch the fulfilled action from the login endpoint to simulate a logged-in state
    store.dispatch({
      type: 'session/setAuthorized',
      payload: { isAuthorized: true, userId: 1, accessToken: 'test-token' },
    })

    // Use generatedApi matcher approach - dispatch a fake fulfilled login action
    store.dispatch({
      type: 'generatedApi/executeQuery/fulfilled',
      payload: {
        user: { id: 1 },
        accessToken: 'test-token',
      },
      meta: {
        arg: { endpointName: 'login' },
        requestStatus: 'fulfilled',
      },
    })
  }

  // Populate cart if cartLines provided
  if (cartLines.length > 0) {
    cartLines.forEach(line => {
      for (let i = 0; i < line.quantity; i++) {
        store.dispatch(cartSlice.actions.addOneItem(line.product))
      }
    })
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialPath]}>
          {children}
        </MemoryRouter>
      </Provider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper }),
    store,
  }
}
