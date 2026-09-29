# Feature: EPMCDMETST-67098 — Enable Checkout button when cart has items (basic checkout entry)
# Jira: https://jiraeu.epam.com/browse/EPMCDMETST-67098
# Last updated: 2026-09-29

Feature: Checkout button state and navigation based on cart contents

  As a user viewing the Cart page
  I want the Checkout button to reflect the current cart state
  So that I can only proceed to checkout when there is something to purchase

  Background:
    Given I am logged in as a registered user
    And I am on the Cart page ("/user/cart")

  # --- Acceptance Criterion 1 ---
  Scenario: Checkout button remains disabled when cart is empty
    Given the cart contains 0 items
    And the totalPrice is 0
    Then the Checkout button is visible
    And the Checkout button is disabled
    And I cannot click the Checkout button to navigate away

  # --- Acceptance Criterion 2 ---
  Scenario: Checkout button is enabled when cart has at least one item
    Given the cart contains at least 1 item
    And the totalPrice is greater than 0
    Then the Checkout button is visible
    And the Checkout button is enabled

  # --- Acceptance Criterion 3 ---
  Scenario: Clicking the enabled Checkout button navigates to the checkout entry experience
    Given the cart contains at least 1 item
    And the totalPrice is greater than 0
    And the Checkout button is enabled
    When I click the Checkout button
    Then I am navigated to "/user/checkout"
    And the checkout entry page is displayed with the Order Total

  # --- Extended scenario: checkout page with empty cart ---
  Scenario: Accessing checkout directly with empty cart shows empty-state message
    Given the cart is empty
    When I navigate directly to "/user/checkout"
    Then the empty-cart message is displayed
    And the "Continue Shopping" button is visible

  # --- Extended scenario: placing an order from the checkout page ---
  Scenario: Placing an order from the checkout page shows order confirmation
    Given the cart contains at least 1 item
    And I am on the Checkout page ("/user/checkout")
    When I click the "Place Order" button
    Then the order confirmation state is displayed
    And the confirmation message contains "Order Confirmed" or "order placed"
    And the "Continue Shopping" button is visible

  # --- Extended scenario: Continue Shopping navigates back to home ---
  Scenario: Clicking "Continue Shopping" on the checkout page navigates back to home
    Given the cart contains at least 1 item
    And I am on the Checkout page ("/user/checkout")
    When I click the "Continue Shopping" button
    Then I am navigated to the home page "/"

  # --- Edge case: unauthenticated access to checkout ---
  Scenario: Unauthenticated user is redirected to login when accessing checkout
    Given I am not logged in
    When I navigate to "/user/checkout"
    Then I am redirected to "/login"

  # --- Edge case: multiple items in cart ---
  Scenario: Checkout button remains enabled when multiple items are in the cart
    Given the cart contains 3 items
    And the totalPrice is greater than 0
    Then the Checkout button is enabled

  # --- Edge case: totalPrice is exactly 1 penny (minimum non-zero) ---
  Scenario: Checkout button is enabled when totalPrice is greater than 0 (boundary)
    Given the cart contains 1 item with a price greater than 0
    Then the isCheckoutDisabled flag is false
    And the Checkout button is enabled
