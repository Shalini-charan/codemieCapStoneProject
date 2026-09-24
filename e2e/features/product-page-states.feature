# Feature: Product page loading, error, and not-found states
# Jira: EPMCDMETST-66352
# Tests the consistency of Product page UI states during fetch lifecycle

Feature: Product page loading, error, and not-found states

  Background:
    Given the application is running at base URL "http://localhost:5173"

  @AC1 @loading
  Scenario: Show loading state on first load while product details are being fetched
    Given I navigate to the Product page with a valid productId "1"
    And the product details request is in-flight
    And no product data has been loaded yet
    When the Product page renders
    Then a visible loading state with data-testid "product-page-loading" is displayed
    And the "Product not found" state with data-testid "product-page-not-found" is not displayed

  @AC2 @error
  Scenario: Show distinct error state when product details request fails
    Given I navigate to the Product page with productId "1"
    And the product details request fails with HTTP status 500
    When the Product page renders the result
    Then a visible error message with data-testid "product-page-error" is displayed
    And the error message text reads "Failed to load product. Please try again."
    And a "Back to main page" link is available in the error state
    And the error message is distinct from the "Product not found" state
    And the "Product not found" state with data-testid "product-page-not-found" is not visible

  @AC3 @not-found
  Scenario: Show not-found state when product does not exist
    Given I navigate to the Product page with productId "1"
    And the product details request completes successfully with no product data
    When the Product page renders the result
    Then the "Product not found" state with data-testid "product-page-not-found" is displayed
    And a link to navigate to the "main page" is available
    And the link to the main page navigates to "/"
    And the error state with data-testid "product-page-error" is not displayed
