import { env } from '@/shared/lib'
import categoriesMock from './__mocks__/categories.json'
import productsMock from './__mocks__/products.json'
import { db, dbHydration } from './serverDb'

type CreateUserParams = {
  email: string
  password: string
  wishlistProductIds?: number[]
}

const idCounters: Record<string, number> = {}

function generateId(tableName: string) {
  idCounters[tableName] = idCounters[tableName] || 1

  return idCounters[tableName]++
}

async function createUser(userData: CreateUserParams) {
  const { wishlistProductIds = [], ...userFields } = userData
  const user = await db.user.create({ ...userFields, id: generateId('user') })

  await db.wishlist.create({
    id: generateId('wishlist'),
    user,
    productIds: wishlistProductIds,
  })

  await db.cart.create({
    id: generateId('cart'),
    user,
    version: 0,
    itemsProductId: [],
    itemsProductQuantity: [],
  })
}

export async function startDatabaseMigration(shouldReset: boolean) {
  // Wait until all the collections are hydrated from the storage
  await dbHydration

  if (shouldReset) {
    db.cart.clear()
    db.user.clear()
    db.wishlist.clear()
    db.product.clear()
    db.category.clear()
  }

  const usersCount = db.user.count()

  // Data already exists by the persist extension
  if (usersCount > 0) {
    return
  }

  // Primary test user: empty cart and empty wishlist for testing empty states
  await createUser({
    email: env.VITE_API_USER_EMAIL,
    password: env.VITE_API_USER_PASSWORD,
    wishlistProductIds: [],
  })
  // Secondary user: pre-populated wishlist for testing non-empty state
  await createUser({ email: 'test@ya.ru', password: '123456', wishlistProductIds: [3, 4, 5, 6, 7] })

  for (const row of categoriesMock) {
    await db.category.create(row)
  }

  for (const row of productsMock) {
    await db.product.create(row)
  }
}
