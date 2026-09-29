Feature: "Browse products" CTA on empty Cart and Wishlist pages (EPMCDMETST-67004)
  # Acceptance Criteria:
  # AC1: Empty Cart page shows a "Browse products" CTA that navigates to '/'
  # AC2: Empty Wishlist page shows a "Browse products" CTA that navigates to '/'
  # AC3: Unauthorized empty state keeps login behavior unchanged
  #      (Login button still present alongside new Browse products button)
  #
  # QA FINDING — GuestGuard intercepts unauthenticated access:
  #   Both /user/cart and /user/wishlist are wrapped by a GuestGuard component in
  #   appRouter.tsx that issues a <Navigate to="/login" /> before the CartPage or
  #   WishlistPage components are mounted. Therefore the component-level
  #   "unauthorized" branches (showing both Login + Browse products buttons) are
  #   unreachable via normal browser navigation. The existing login-redirect
  #   behavior (GuestGuard → /login) is preserved and is the only observable
  #   behavior for unauthenticated users. AC3 is validated through this redirect
  #   contract; the in-component unauthorized UI is dead code.

  Background:
    Given the application is running at http://localhost:5173
    And the primary test user "user@nukeapp.com" has an empty cart and empty wishlist

  # ─────────────────────────────────────────────
  # AC1 — Empty Cart page: "Browse products" CTA
  # ─────────────────────────────────────────────

  @auth @cart @AC1
  Scenario: Authenticated user with empty cart sees "Browse products" button
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/cart"
    And the cart has finished loading
    Then a "Browse products" button is visible on the page
    And the heading "Bag" is visible on the page
    And the empty-cart message "There are no products in your bag. Add someone and return." is visible

  @auth @cart @AC1 @navigation
  Scenario: Clicking "Browse products" on empty Cart navigates to the main catalog
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/cart"
    And the cart has finished loading
    And the user clicks the "Browse products" button
    Then the application URL is "/"
    And the main catalog page is displayed

  # ─────────────────────────────────────────────
  # AC2 — Empty Wishlist page: "Browse products" CTA
  # ─────────────────────────────────────────────

  @auth @wishlist @AC2
  Scenario: Authenticated user with empty wishlist sees "Browse products" button and corrected text
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then a "Browse products" button is visible on the page
    And the heading "Wishlist" is visible on the page (without a count suffix)
    And the empty-wishlist message "There are no products in your wishlist. Add some by clicking the heart icon." is visible

  @auth @wishlist @AC2 @regression
  Scenario: Corrected wishlist empty-state copy does not contain old typo "Add someone"
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then the page does NOT show text containing "Add someone"
    And the page shows text containing "Add some by clicking the heart icon"

  @auth @wishlist @AC2 @navigation
  Scenario: Clicking "Browse products" on empty Wishlist navigates to the main catalog
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    And the user clicks the "Browse products" button
    Then the application URL is "/"
    And the main catalog page is displayed

  # ─────────────────────────────────────────────
  # AC3 — Unauthorized state: login behavior unchanged
  #
  # NOTE: GuestGuard redirects unauthenticated users to /login before the page
  # component renders. This is the ACTUAL observable login behavior.
  # The component-level "unauthorized" branch with Login + Browse products is
  # dead code (see Feature-level note above).
  # ─────────────────────────────────────────────

  @unauthenticated @cart @AC3
  Scenario: Unauthenticated user visiting /user/cart is redirected to /login (GuestGuard)
    Given the user is NOT authenticated
    When the user navigates to "/user/cart"
    Then the application URL contains "/login"
    And the login page is displayed
    And no "Browse products" button is shown on the login page

  @unauthenticated @wishlist @AC3
  Scenario: Unauthenticated user visiting /user/wishlist is redirected to /login (GuestGuard)
    Given the user is NOT authenticated
    When the user navigates to "/user/wishlist"
    Then the application URL contains "/login"
    And the login page is displayed
    And no "Browse products" button is shown on the login page

  # ─────────────────────────────────────────────
  # AC3 — Regression: authenticated view must not show in-component "login" messaging
  # ─────────────────────────────────────────────

  @auth @cart @AC3 @regression
  Scenario: Authenticated user on cart does not see "Login to see your cart" message
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/cart"
    And the cart has finished loading
    Then the page does NOT show text "Login to see your cart."

  @auth @wishlist @AC3 @regression
  Scenario: Authenticated user on wishlist does not see "Login to see your wishlist" message
    Given the user is authenticated as "user@nukeapp.com"
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then the page does NOT show text "Login to see your wishlist."

  # ─────────────────────────────────────────────
  # Regression: non-empty states do not show Browse products CTA
  # ─────────────────────────────────────────────

  @auth @wishlist @regression @nonEmpty
  Scenario: Authenticated user with non-empty wishlist does NOT see "Browse products" button
    Given the user is authenticated as "test@ya.ru" who has a pre-populated wishlist
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then a product grid is visible
    And "Browse products" button is NOT visible on the page
