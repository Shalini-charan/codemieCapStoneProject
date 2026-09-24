import { Link } from 'react-router-dom'
import { z } from 'zod'
import type { ProductId } from '@/entities/product'
import { useTypedParams } from '@/shared/lib/router'
import { useGetProductDetailsQuery } from '../../api/productDetailsApi'
import { ProductDetails } from '../ProductDetails/ProductDetails'

const pageParamsSchema = z.object({
  productId: z
    .coerce
    .number()
    .positive()
    .transform(value => value as ProductId),
})

export function ProductPage() {
  const { productId } = useTypedParams(pageParamsSchema)
  const { data, isFetching, isLoading, isError } = useGetProductDetailsQuery({ id: productId })

  /**
   * Use isLoading for only first loading (no cached data yet)
   * For subsequent loading use isFetching
   */
  if (isLoading) {
    return (
      <div data-testid="product-page-loading">
        <h1 className="text_2xl">Loading...</h1>
      </div>
    )
  }

  if (isError) {
    return (
      <div data-testid="product-page-error">
        Failed to load product. Please try again.
        {' '}
        <Link to="/">Back to main page</Link>
      </div>
    )
  }

  const isNotFound = !isLoading && !isFetching && !isError && !data

  if (isNotFound) {
    return (
      <div data-testid="product-page-not-found">
        Product not found, go to
        {' '}
        <Link to="/">main page</Link>
      </div>
    )
  }

  return <ProductDetails productDetails={data} isFetching={isFetching} />
}
