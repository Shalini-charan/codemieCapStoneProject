Feature: Wishlist page empty state — copy and CTA (EPMCDMETST-66326)
  # Acceptance Criteria:
  # AC1: Authenticated user with empty wishlist sees corrected guidance text
  #      ("Add some by clicking the heart icon" — not the old typo "Add someone…")
  # AC2: "Browse products" button is visible on empty-state view
  # AC3: Clicking "Browse products" navigates to the main/catalog page (/)
  # Out-of-scope (unchanged behavior):
  # - Unauthenticated users are redirected to /login (GuestGuard)
  # - Non-empty wishlist shows products grid and no empty-state elements

  Background:
    Given the application is running at http://localhost:5173
    And the user can access the login page at /login

  # ──────────────────────────────────────────
  # AC1 + AC2 — Empty state copy and CTA
  # ──────────────────────────────────────────

  @auth @empty @AC1 @AC2
  Scenario: Authenticated user with empty wishlist sees corrected copy and Browse products button
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API returns an empty list
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then the page shows the empty-state message exactly:
      """
      There are no products in your wishlist. Add some by clicking the heart icon.
      """
    And a "Browse products" button is visible on the page
    And "Fetching..." is NOT visible on the page
    And the Wishlist title shows "Wishlist" without a count suffix

  @auth @empty @AC1 @regression
  Scenario: Corrected empty-state copy does not contain the old typo "Add someone"
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API returns an empty list
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then the page does NOT show text containing "Add someone"
    And the page shows text containing "Add some by clicking the heart icon"

  # ──────────────────────────────────────────
  # AC3 — Browse products CTA navigation
  # ──────────────────────────────────────────

  @auth @empty @AC3
  Scenario: Clicking "Browse products" navigates to the main catalog page
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API returns an empty list
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    And the user clicks the "Browse products" button
    Then the application URL is "/"
    And the main catalog page is displayed (element with data-fsd "page/main/Page" is visible)

  # ──────────────────────────────────────────
  # Out-of-scope / unchanged behavior guards
  # ──────────────────────────────────────────

  @unauthenticated @regression
  Scenario: Unauthenticated user visiting /user/wishlist is redirected to /login
    Given the user is NOT authenticated
    When the user navigates to "/user/wishlist"
    Then the application URL contains "/login"
    And the login page is displayed

  @auth @nonEmpty @regression
  Scenario: Authenticated user with non-empty wishlist sees products grid, not empty state
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API returns a list with at least 1 product
    When the user navigates to "/user/wishlist"
    And the wishlist has finished loading
    Then the products grid is visible
    And the empty-state message is NOT visible
    And "Browse products" button is NOT visible
    And the Wishlist title shows a count in parentheses

  # ──────────────────────────────────────────
  # Loading / transition states
  # ──────────────────────────────────────────

  @auth @loading
  Scenario: Loading state shows "Fetching..." and hides Browse products
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API is pending (not yet responded)
    When the user navigates to "/user/wishlist"
    Then "Fetching..." is visible on the page
    And "Browse products" button is NOT visible
    And the empty-state message is NOT visible

  @auth @loading @transition
  Scenario: Wishlist transitions from loading to empty state
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API is pending (not yet responded)
    When the user navigates to "/user/wishlist"
    Then "Fetching..." is visible on the page
    When the wishlist API responds with an empty list
    Then "Fetching..." is NOT visible on the page
    And the empty-state message is visible
    And "Browse products" button is visible

  @auth @loading @transition
  Scenario: Wishlist transitions from loading to non-empty state
    Given the user is authenticated as "user@nukeapp.com"
    And the wishlist API is pending (not yet responded)
    When the user navigates to "/user/wishlist"
    Then "Fetching..." is visible on the page
    When the wishlist API responds with at least 1 product
    Then "Fetching..." is NOT visible on the page
    And the products grid is visible
    And "Browse products" button is NOT visible
