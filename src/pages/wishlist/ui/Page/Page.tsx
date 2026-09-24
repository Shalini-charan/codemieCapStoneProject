import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useNavigate } from 'react-router-dom'
import { selectCartQuantityByProductId } from '@/entities/cart'
import type { ProductId } from '@/entities/product'
import { mapProductToCompactView } from '@/entities/product'
import { selectIsAuthorized } from '@/entities/session'
import { useGetWishlistProductsQuery, useUpdateWishlistProductsMutation } from '@/entities/wishlist'
import { AddToWishlistIcon } from '@/features/wishlist/addToWishlist'
import { useAppSelector } from '@/shared/lib/redux'
import { Button, ProductGrid } from '@/shared/ui'
import type { ProductCompactView } from '@/shared/ui'

export function WishlistPage() {
  const isAuthorized = useAppSelector(selectIsAuthorized)
  const navigate = useNavigate()
  const quantityByProductId = useAppSelector(selectCartQuantityByProductId)
  const [, { isLoading: isActionFetching }] = useUpdateWishlistProductsMutation({
    // This field sync mutation which running from other place
    // @see src/features/wishlist/addToWishlist/model/toggleWishlistProduct.ts
    fixedCacheKey: 'shared-add-to-wishlist',
  })
  const { data: wishlistProducts = [], isFetching } = useGetWishlistProductsQuery(
    isAuthorized ? undefined : skipToken,
  )

  const onLogin = useCallback(() => {
    navigate('/login', {
      state: { returnUrl: `/user/wishlist` },
    })
  }, [])

  const onBrowseProducts = useCallback(() => {
    navigate('/')
  }, [navigate])

  const products = useMemo(
    () => wishlistProducts.map(mapProductToCompactView),
    [wishlistProducts],
  )

  const handleProductClick = useCallback(
    (productId: string) => {
      navigate(`/product/${productId}`)
    },
    [navigate],
  )

  const renderActions = useCallback(
    (product: ProductCompactView) => (
      <AddToWishlistIcon productId={Number(product.id) as ProductId} />
    ),
    [],
  )

  const content = useMemo(() => {
    if (!isAuthorized) {
      return (
        <div>
          <div>Login to see your wishlist.</div>
          <Button onClick={onLogin}>Login</Button>
        </div>
      )
    }

    if (isFetching && products.length === 0) {
      return <div>Fetching...</div>
    }

    if (!isFetching && products.length === 0) {
      return (
        <div>
          <div>There are no products in your wishlist. Add some by clicking the heart icon.</div>
          <Button onClick={onBrowseProducts}>Browse products</Button>
        </div>
      )
    }

    return (
      <div>
        <ProductGrid
          products={products}
          quantityByProductId={quantityByProductId}
          actions={renderActions}
          columns="auto"
          onProductClick={handleProductClick}
        />
      </div>
    )
  }, [isAuthorized, isFetching, products, quantityByProductId, renderActions, handleProductClick, onBrowseProducts])

  const title = `Wishlist ${
    isAuthorized && products.length > 0
      ? `(${isFetching || isActionFetching ? '...' : products.length})`
      : ''
  }`

  return (
    <div data-fsd="page/wishlist/Page">
      <h1>{title}</h1>
      {content}
    </div>
  )
}
